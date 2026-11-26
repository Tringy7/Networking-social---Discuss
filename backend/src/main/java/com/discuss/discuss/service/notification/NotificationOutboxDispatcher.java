package com.discuss.discuss.service.notification;

import com.discuss.discuss.config.logging.NotificationSqlLogFilter;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.concurrent.ScheduledFuture;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
class NotificationOutboxDispatcher {
    private final NotificationOutboxWorker worker;
    private final TaskScheduler scheduler;

    private ScheduledFuture<?> scheduled;
    private Instant scheduledAt;
    private long generation;
    private boolean running;

    @TransactionalEventListener(classes = NotificationEvents.Queued.class, phase = TransactionPhase.AFTER_COMMIT)
    public void onQueued() {
        schedule(Instant.now());
    }

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(initialDelayString = "${app.notifications.recovery-delay-ms:300000}",
            fixedDelayString = "${app.notifications.recovery-delay-ms:300000}")
    public void recoverPending() {
        schedule(Instant.now());
    }

    private synchronized void schedule(Instant at) {
        if (scheduledAt != null && !at.isBefore(scheduledAt)) {
            return;
        }
        if (running) {
            scheduledAt = at;
            return;
        }
        if (scheduled != null) {
            scheduled.cancel(false);
        }
        long ticket = ++generation;
        try {
            scheduled = scheduler.schedule(() -> dispatch(ticket), at);
            scheduledAt = at;
        } catch (TaskRejectedException rejected) {
            scheduled = null;
            scheduledAt = null;
            log.debug("Notification dispatch could not be scheduled; saved events remain pending", rejected);
        }
    }

    private void dispatch(long ticket) {
        synchronized (this) {
            if (ticket != generation) {
                return;
            }
            scheduled = null;
            scheduledAt = null;
            running = true;
        }
        try (var ignored = MDC.putCloseable(NotificationSqlLogFilter.WORKER_CONTEXT, "true")) {
            worker.processDueEvents().ifPresent(next -> {
                Duration wait = Duration.between(LocalDateTime.now(), next);
                schedule(Instant.now().plus(wait.isNegative() ? Duration.ZERO : wait));
            });
        } catch (RuntimeException failure) {
            log.warn("Notification dispatch failed; pending events will be recovered", failure);
        } finally {
            synchronized (this) {
                running = false;
                Instant next = scheduledAt;
                scheduledAt = null;
                if (next != null) {
                    schedule(next);
                }
            }
        }
    }
}

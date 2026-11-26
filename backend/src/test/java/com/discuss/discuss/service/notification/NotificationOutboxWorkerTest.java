package com.discuss.discuss.service.notification;

import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.repository.*;
import com.discuss.discuss.service.post.PostSupport;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class NotificationOutboxWorkerTest {
    private final OutboxEventRepository events = mock(OutboxEventRepository.class);
    private final NotificationRepository notifications = mock(NotificationRepository.class);
    private final EntityManager entities = mock(EntityManager.class);
    private final PlatformTransactionManager transactions = mock(PlatformTransactionManager.class);
    private final NotificationOutboxWorker worker = new NotificationOutboxWorker(events, notifications,
            mock(CommunityMemberRepository.class), entities, mock(PostSupport.class), transactions);
    private final OutboxEvent event = OutboxEvent.builder().id(1L).actorId(2L).reporterId(3L)
            .eventType(NotificationEventType.REPORT_REVIEWED).status(OutboxStatus.PENDING)
            .nextAttemptAt(LocalDateTime.now().minusMinutes(1)).build();

    @BeforeEach
    void loadDueEvent() {
        when(transactions.getTransaction(any(TransactionDefinition.class)))
                .thenAnswer(call -> new SimpleTransactionStatus());
        when(events.findDueIds(eq(OutboxStatus.PENDING), any(LocalDateTime.class), eq(PageRequest.of(0, 25))))
                .thenReturn(List.of(1L));
        when(entities.find(OutboxEvent.class, 1L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(event);
        when(entities.getReference(User.class, 2L)).thenReturn(User.builder().id(2L).build());
    }

    @Test
    void deliversToReporterAndDoesNotSendCompletedEventAgain() {
        worker.processDueEvents();
        worker.processDueEvents();

        var notification = ArgumentCaptor.forClass(Notification.class);
        verify(notifications, times(1)).save(notification.capture());
        assertThat(notification.getValue().getRecipientId()).isEqualTo(3L);
        assertThat(notification.getValue().getType()).isEqualTo(NotificationType.REPORT_REVIEWED);
        assertThat(event.getStatus()).isEqualTo(OutboxStatus.COMPLETED);
        assertThat(event.getProcessedAt()).isNotNull();
    }

    @ParameterizedTest
    @CsvSource({"0, PENDING", "4, FAILED"})
    void recordsStorageFailureAndStopsRetryingAtAttemptLimit(int previousAttempts, OutboxStatus status) {
        event.setAttemptCount(previousAttempts);
        LocalDateTime start = LocalDateTime.now();
        when(notifications.save(any(Notification.class))).thenThrow(new IllegalStateException("storage down"));

        worker.processDueEvents();

        assertThat(event.getAttemptCount()).isEqualTo(previousAttempts + 1);
        assertThat(event.getStatus()).isEqualTo(status);
        assertThat(event.getLastError()).isEqualTo("IllegalStateException");
        if (status == OutboxStatus.PENDING) {
            assertThat(event.getNextAttemptAt()).isAfterOrEqualTo(start.plusSeconds(5));
        }
        verify(transactions).rollback(any());
        verify(transactions).commit(any());
    }
}

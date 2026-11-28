package com.discuss.discuss.service.notification;

import com.discuss.discuss.entity.Comment;
import com.discuss.discuss.entity.OutboxEvent;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.repository.OutboxEventRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class NotificationEvents {
    private final OutboxEventRepository repository;
    private final ApplicationEventPublisher publisher;

    record Queued() {}

    public void enqueuePostCreatedNotification(Post post) {
        saveAndSignalOutboxEvent(newOutboxEvent(NotificationEventType.POST_CREATED, post.getUser().getId())
                .postId(post.getId()).communityId(post.getCommunity().getId()).build());
    }

    public void enqueueCommentCreatedNotification(Comment comment) {
        saveAndSignalOutboxEvent(newOutboxEvent(NotificationEventType.COMMENT_CREATED, comment.getUser().getId())
                .postId(comment.getPost().getId()).commentId(comment.getId()).build());
    }

    public void enqueueReportSubmittedNotification(Long actorId, Long reportId, ReportTargetType type, Long communityId) {
        saveAndSignalOutboxEvent(newOutboxEvent(NotificationEventType.REPORT_SUBMITTED, actorId)
                .reportId(reportId).reportTargetType(type).communityId(communityId).build());
    }

    public void enqueueReportReviewedNotification(Long actorId, Long reportId, ReportTargetType type, Long reporterId, ReportStatus status) {
        saveAndSignalOutboxEvent(newOutboxEvent(NotificationEventType.REPORT_REVIEWED, actorId)
                .reportId(reportId).reportTargetType(type).reporterId(reporterId).reportStatus(status).build());
    }

    public void enqueueCommunityMembershipNotification(NotificationEventType type, Long applicantId, Long communityId) {
        saveAndSignalOutboxEvent(newOutboxEvent(type, applicantId).communityId(communityId).build());
    }

    private OutboxEvent.OutboxEventBuilder newOutboxEvent(NotificationEventType type, Long actorId) {
        LocalDateTime now = LocalDateTime.now();
        return OutboxEvent.builder().eventType(type).actorId(actorId).status(OutboxStatus.PENDING)
                .createdAt(now).nextAttemptAt(now);
    }

    public void enqueueReportWarningNotification(Long adminId, Long reportId, ReportTargetType type, Long recipientId,
                              Long postId, Long communityId) {
        saveAndSignalOutboxEvent(newOutboxEvent(NotificationEventType.REPORT_WARNING, adminId)
                .reportId(reportId).reportTargetType(type).reportStatus(ReportStatus.RESOLVED)
                .warningRecipientId(recipientId).postId(postId).communityId(communityId).build());
    }

    private void saveAndSignalOutboxEvent(OutboxEvent event) {
        repository.save(event);
        publisher.publishEvent(new Queued());
    }
}

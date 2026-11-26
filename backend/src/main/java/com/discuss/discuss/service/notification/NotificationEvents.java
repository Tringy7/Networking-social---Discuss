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

    public void postCreated(Post post) {
        enqueue(event(NotificationEventType.POST_CREATED, post.getUser().getId())
                .postId(post.getId()).communityId(post.getCommunity().getId()).build());
    }

    public void commentCreated(Comment comment) {
        enqueue(event(NotificationEventType.COMMENT_CREATED, comment.getUser().getId())
                .postId(comment.getPost().getId()).commentId(comment.getId()).build());
    }

    public void reportSubmitted(Long actorId, Long reportId, ReportTargetType type, Long communityId) {
        enqueue(event(NotificationEventType.REPORT_SUBMITTED, actorId)
                .reportId(reportId).reportTargetType(type).communityId(communityId).build());
    }

    public void reportReviewed(Long actorId, Long reportId, ReportTargetType type, Long reporterId, ReportStatus status) {
        enqueue(event(NotificationEventType.REPORT_REVIEWED, actorId)
                .reportId(reportId).reportTargetType(type).reporterId(reporterId).reportStatus(status).build());
    }

    public void communityMembershipChanged(NotificationEventType type, Long applicantId, Long communityId) {
        enqueue(event(type, applicantId).communityId(communityId).build());
    }

    private OutboxEvent.OutboxEventBuilder event(NotificationEventType type, Long actorId) {
        LocalDateTime now = LocalDateTime.now();
        return OutboxEvent.builder().eventType(type).actorId(actorId).status(OutboxStatus.PENDING)
                .createdAt(now).nextAttemptAt(now);
    }

    public void reportWarning(Long adminId, Long reportId, ReportTargetType type, Long recipientId,
                              Long postId, Long communityId) {
        enqueue(event(NotificationEventType.REPORT_WARNING, adminId)
                .reportId(reportId).reportTargetType(type).reportStatus(ReportStatus.RESOLVED)
                .warningRecipientId(recipientId).postId(postId).communityId(communityId).build());
    }

    private void enqueue(OutboxEvent event) {
        repository.save(event);
        publisher.publishEvent(new Queued());
    }
}

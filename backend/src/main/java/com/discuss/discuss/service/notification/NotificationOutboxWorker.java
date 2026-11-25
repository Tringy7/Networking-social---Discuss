package com.discuss.discuss.service.notification;

import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.repository.NotificationRepository;
import com.discuss.discuss.repository.OutboxEventRepository;
import com.discuss.discuss.service.post.PostSupport;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Component
@Slf4j
public class NotificationOutboxWorker {
    private static final int BATCH_SIZE = 25;
    private static final int MAX_ATTEMPTS = 5;

    private final OutboxEventRepository events;
    private final NotificationRepository notifications;
    private final CommunityMemberRepository memberships;
    private final EntityManager entities;
    private final PostSupport postSupport;
    private final TransactionTemplate transaction;

    public NotificationOutboxWorker(OutboxEventRepository events, NotificationRepository notifications,
                                    CommunityMemberRepository memberships, EntityManager entities,
                                    PostSupport postSupport, PlatformTransactionManager transactionManager) {
        this.events = events;
        this.notifications = notifications;
        this.memberships = memberships;
        this.entities = entities;
        this.postSupport = postSupport;
        this.transaction = new TransactionTemplate(transactionManager);
    }

    Optional<LocalDateTime> processDueEvents() {
        var ids = events.findDueIds(OutboxStatus.PENDING, LocalDateTime.now(), PageRequest.of(0, BATCH_SIZE));
        for (Long id : ids) {
            try {
                transaction.executeWithoutResult(ignored -> process(id));
            } catch (RuntimeException failure) {
                log.warn("Notification event {} failed ({})", id, failure.getClass().getSimpleName());
                transaction.executeWithoutResult(ignored -> recordFailure(id, failure));
            }
        }
        if (ids.size() == BATCH_SIZE) {
            return Optional.of(LocalDateTime.now());
        }
        return events.findNextAttempts(OutboxStatus.PENDING, PageRequest.of(0, 1)).stream().findFirst();
    }

    private void process(Long id) {
        var event = lockDueEvent(id);
        if (event == null) {
            return;
        }
        switch (event.getEventType()) {
            case POST_CREATED -> notifyCommunity(event);
            case COMMENT_CREATED -> notifyComment(event);
            case REPORT_SUBMITTED -> notifyReportSubmitted(event);
            case REPORT_REVIEWED -> save(event, event.getReporterId(), NotificationType.REPORT_REVIEWED, null);
            case REPORT_WARNING -> notifyReportWarning(event);
            case COMMUNITY_JOINED -> notifyMembership(event,
                    NotificationType.COMMUNITY_JOIN_CONFIRMED, NotificationType.COMMUNITY_MEMBER_JOINED);
            case COMMUNITY_JOIN_REQUESTED -> notifyMembership(event,
                    NotificationType.COMMUNITY_JOIN_REQUEST_SENT, NotificationType.COMMUNITY_JOIN_REQUEST_RECEIVED);
            case COMMUNITY_JOIN_APPROVED -> notifyMembership(event,
                    NotificationType.COMMUNITY_JOIN_APPROVED, NotificationType.COMMUNITY_MEMBER_JOINED);
            case COMMUNITY_JOIN_REJECTED -> notifyMembership(event, NotificationType.COMMUNITY_JOIN_REJECTED, null);
        }
        event.setStatus(OutboxStatus.COMPLETED);
        event.setProcessedAt(LocalDateTime.now());
        event.setLastError(null);
    }

    private void notifyCommunity(OutboxEvent event) {
        var post = entities.find(Post.class, event.getPostId());
        if (!isPublished(post)) {
            return;
        }
        var community = post.getCommunity();
        var recipients = memberships.findNotificationRecipientIds(
                event.getCommunityId(), MembershipStatus.ACTIVE, event.getActorId());
        for (Long recipient : recipients) {
            save(event, recipient, NotificationType.COMMUNITY_POST_CREATED, community.getName());
        }
    }

    private void notifyComment(OutboxEvent event) {
        var comment = entities.find(Comment.class, event.getCommentId());
        if (comment == null || comment.getStatus() != CommentStatus.VISIBLE || !isPublished(comment.getPost())) {
            return;
        }
        var post = comment.getPost();
        Map<Long, NotificationType> recipients = new HashMap<>();
        recipients.put(post.getUser().getId(), NotificationType.POST_COMMENTED);
        if (comment.getParentComment() != null) {
            recipients.put(comment.getParentComment().getUser().getId(), NotificationType.COMMENT_REPLIED);
        }
        recipients.remove(event.getActorId());
        recipients.forEach((recipient, type) -> {
            var user = entities.find(User.class, recipient);
            if (user != null && user.getStatus() == UserStatus.ACTIVE && canRead(post, user)) {
                save(event, recipient, type, post.getCommunity().getName());
            }
        });
    }

    private void notifyReportSubmitted(OutboxEvent event) {
        var community = entities.find(Community.class, event.getCommunityId());
        if (event.getReportTargetType() == ReportTargetType.COMMUNITY) {
            var admins = entities.createQuery("""
                    select u.id from User u where u.role = :role and u.status = :status and u.id <> :actor
                    """, Long.class).setParameter("role", UserRole.ADMIN).setParameter("status", UserStatus.ACTIVE)
                    .setParameter("actor", event.getActorId()).getResultList();
            admins.forEach(admin -> save(event, admin, NotificationType.REPORT_SUBMITTED, null));
        } else if (community != null && community.getStatus() == CommunityStatus.ACTIVE) {
            memberships.findStaffNotificationRecipientIds(community.getId(), MembershipStatus.ACTIVE, UserStatus.ACTIVE,
                            List.of(CommunityRole.OWNER, CommunityRole.MODERATOR), event.getActorId())
                    .forEach(recipient -> save(event, recipient, NotificationType.REPORT_SUBMITTED, community.getName()));
        }
    }

    private void notifyMembership(OutboxEvent event, NotificationType applicantType, NotificationType staffType) {
        var community = entities.find(Community.class, event.getCommunityId());
        if (community == null || community.getStatus() != CommunityStatus.ACTIVE) {
            return;
        }
        save(event, event.getActorId(), applicantType, community.getName());
        if (staffType != null) {
            memberships.findStaffNotificationRecipientIds(community.getId(), MembershipStatus.ACTIVE, UserStatus.ACTIVE,
                            List.of(CommunityRole.OWNER, CommunityRole.MODERATOR), event.getActorId())
                    .forEach(recipient -> save(event, recipient, staffType, community.getName()));
        }
    }

    private void notifyReportWarning(OutboxEvent event) {
        var community = entities.find(Community.class, event.getCommunityId());
        save(event, event.getWarningRecipientId(), NotificationType.REPORT_WARNING,
                community == null ? null : community.getName());
    }

    private void save(OutboxEvent event, Long recipient, NotificationType type, String communityName) {
        notifications.save(Notification.builder()
                .eventId(event.getId()).recipientId(recipient)
                .actor(entities.getReference(User.class, event.getActorId())).type(type)
                .postId(event.getPostId()).commentId(event.getCommentId()).communityName(communityName)
                .reportId(event.getReportId()).reportTargetType(event.getReportTargetType())
                .reportStatus(event.getReportStatus()).build());
    }

    private boolean isPublished(Post post) {
        return post != null && post.getStatus() == PostStatus.PUBLISHED
                && post.getCommunity().getStatus() == CommunityStatus.ACTIVE;
    }

    private boolean canRead(Post post, User user) {
        try {
            postSupport.requireRead(post, user);
            return true;
        } catch (PostException denied) {
            return false;
        }
    }

    private OutboxEvent lockDueEvent(Long id) {
        var event = entities.find(OutboxEvent.class, id, LockModeType.PESSIMISTIC_WRITE);
        return event != null && event.getStatus() == OutboxStatus.PENDING
                && !event.getNextAttemptAt().isAfter(LocalDateTime.now()) ? event : null;
    }

    private void recordFailure(Long id, RuntimeException failure) {
        var event = lockDueEvent(id);
        if (event == null) {
            return;
        }
        int attempts = event.getAttemptCount() + 1;
        event.setAttemptCount(attempts);
        event.setLastError(failure.getClass().getSimpleName());
        if (attempts >= MAX_ATTEMPTS) {
            event.setStatus(OutboxStatus.FAILED);
        } else {
            event.setNextAttemptAt(LocalDateTime.now().plusSeconds(5L << (attempts - 1)));
        }
    }
}

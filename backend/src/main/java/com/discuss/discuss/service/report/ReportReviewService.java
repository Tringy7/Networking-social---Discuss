package com.discuss.discuss.service.report;

import com.discuss.discuss.dto.report.ReportResponseDTO;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.exception.report.ReportErrorCode;
import com.discuss.discuss.exception.report.ReportException;
import com.discuss.discuss.mapper.report.ReportMapper;
import com.discuss.discuss.service.community.CommunityAuthorizationService;
import com.discuss.discuss.service.community.CommunitySupport;
import com.discuss.discuss.service.notification.NotificationEvents;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportReviewService {
    private final EntityManager entityManager;
    private final ReportMapper mapper;
    private final UserService userService;
    private final CommunitySupport communitySupport;
    private final CommunityAuthorizationService communityAuthorization;
    private final NotificationEvents notificationEvents;

    @HasRole("ADMIN")
    @Transactional(readOnly = true)
    public ReportResponseDTO getDetail(ReportTargetType type, Long id) {
        return switch (type) {
            case POST -> mapper.toResponse(find(PostReport.class, id, false));
            case COMMENT -> mapper.toResponse(find(CommentReport.class, id, false));
            case COMMUNITY -> mapper.toResponse(find(CommunityReport.class, id, false));
        };
    }

    @HasRole("ADMIN")
    @Transactional
    public ReportResponseDTO review(ReportTargetType type, Long id, ReportStatus status, String note) {
        return review(type, id, status, note, userService.getCurrentUser(), null);
    }

    @Transactional
    public ReportResponseDTO reviewForCommunity(
            String communityName, ReportTargetType type, Long id, ReportStatus status, String note) {
        if (type == ReportTargetType.COMMUNITY) {
            throw new ReportException(ReportErrorCode.INVALID_COMMUNITY_REPORT_TYPE);
        }
        User actor = userService.getCurrentUser();
        Community community = communitySupport.getCommunityByName(communityName);
        communityAuthorization.requireOwner(community, actor);
        return review(type, id, status, note, actor, community);
    }

    private ReportResponseDTO review(
            ReportTargetType type, Long id, ReportStatus status, String note, User actor, Community community) {
        if (status != ReportStatus.RESOLVED && status != ReportStatus.REJECTED) {
            throw new ReportException(ReportErrorCode.INVALID_REPORT_STATUS);
        }
        if (note == null || note.isBlank() || note.length() > 2000) {
            throw new ReportException(ReportErrorCode.INVALID_REVIEW_NOTE);
        }
        String resolutionNote = note.strip();
        LocalDateTime now = LocalDateTime.now();
        String action = status == ReportStatus.RESOLVED ? "REVIEWED" : "REJECTED";
        return switch (type) {
            case POST -> {
                var report = find(PostReport.class, id, true);
                if (community != null) {
                    requireCommunity(community, report.getPost().getCommunity());
                }
                requirePending(report.getStatus());
                report.setStatus(status);
                report.setHandledBy(actor);
                report.setHandledAt(now);
                report.setResolutionNote(resolutionNote);
                report.setAction(action);
                notificationEvents.reportReviewed(actor.getId(), id, type, report.getUser().getId(), status);
                if (community == null && status == ReportStatus.RESOLVED) {
                    Post post = report.getPost();
                    notificationEvents.reportWarning(actor.getId(), id, type, post.getUser().getId(),
                            post.getId(), post.getCommunity().getId());
                }
                yield mapper.toResponse(report);
            }
            case COMMENT -> {
                var report = find(CommentReport.class, id, true);
                if (community != null) {
                    requireCommunity(community, report.getComment().getPost().getCommunity());
                }
                requirePending(report.getStatus());
                report.setStatus(status);
                report.setHandledBy(actor);
                report.setHandledAt(now);
                report.setResolutionNote(resolutionNote);
                report.setAction(action);
                notificationEvents.reportReviewed(actor.getId(), id, type, report.getReporter().getId(), status);
                yield mapper.toResponse(report);
            }
            case COMMUNITY -> {
                var report = find(CommunityReport.class, id, true);
                requirePending(report.getStatus());
                report.setStatus(status);
                report.setHandledBy(actor);
                report.setHandledAt(now);
                report.setResolutionNote(resolutionNote);
                report.setAction(action);
                notificationEvents.reportReviewed(actor.getId(), id, type, report.getUser().getId(), status);
                Community reportedCommunity = report.getCommunity();
                if (status == ReportStatus.RESOLVED && reportedCommunity.getOwner() != null) {
                    notificationEvents.reportWarning(actor.getId(), id, type, reportedCommunity.getOwner().getId(),
                            null, reportedCommunity.getId());
                }
                yield mapper.toResponse(report);
            }
        };
    }

    private void requireCommunity(Community expected, Community actual) {
        if (!Objects.equals(expected.getId(), actual.getId())) {
            throw new ReportException(ReportErrorCode.REPORT_NOT_FOUND);
        }
    }

    private void requirePending(ReportStatus status) {
        if (status != ReportStatus.PENDING) throw new ReportException(ReportErrorCode.REPORT_ALREADY_HANDLED);
    }

    private <T> T find(Class<T> type, Long id, boolean lock) {
        T report = lock ? entityManager.find(type, id, LockModeType.PESSIMISTIC_WRITE)
                : entityManager.find(type, id);
        if (report == null) throw new ReportException(ReportErrorCode.REPORT_NOT_FOUND);
        return report;
    }
}

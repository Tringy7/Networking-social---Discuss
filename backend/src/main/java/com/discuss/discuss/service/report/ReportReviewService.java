package com.discuss.discuss.service.report;

import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.repository.ChatMessageReportRepository;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.comment.CommentAttachmentDTO;
import com.discuss.discuss.dto.report.AdminReportTargetDTO;
import com.discuss.discuss.dto.report.ReportResponseDTO;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.exception.report.ReportErrorCode;
import com.discuss.discuss.exception.report.ReportException;
import com.discuss.discuss.mapper.report.ReportMapper;
import com.discuss.discuss.service.comment.CommentSupport;
import com.discuss.discuss.service.community.CommunityAuthorizationService;
import com.discuss.discuss.service.community.CommunitySupport;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.service.notification.NotificationEvents;
import com.discuss.discuss.service.post.PostSupport;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    private final PostSupport postSupport;
    private final CommentSupport commentSupport;
    private final CommunityService communityService;
    private final ActivityLogService activityLog;
    private final ChatMessageReportRepository chatReports;
    private final PageMapper pageMapper;

    @HasRole("ADMIN")
    @Transactional(readOnly = true)
    public PageResponseDTO<ReportResponseDTO> listMessages(
            ReportStatus status, String community, Pageable pageable) {
        var result = community == null || community.isBlank() ? chatReports.list(status, pageable)
                : Page.<ChatMessageReport>empty(pageable);
        return pageMapper.toResponse(result.map(mapper::toResponse));
    }

    @HasRole("ADMIN")
    @Transactional(readOnly = true)
    public ReportResponseDTO getDetail(ReportTargetType type, Long id) {
        return switch (type) {
            case MESSAGE -> mapper.toResponse(find(ChatMessageReport.class, id, false));
            case POST -> mapper.toResponse(find(PostReport.class, id, false));
            case COMMENT -> mapper.toResponse(find(CommentReport.class, id, false));
            case COMMUNITY -> mapper.toResponse(find(CommunityReport.class, id, false));
        };
    }

    @HasRole("ADMIN")
    @Transactional
    public AdminReportTargetDTO getTarget(ReportTargetType type, Long id) {
        return switch (type) {
            case MESSAGE -> {
                var report = find(ChatMessageReport.class, id, false);
                activityLog.record("VIEW_REPORTED_MESSAGE", "MESSAGE_REPORT", id, null);
                yield new AdminReportTargetDTO(null, null, null, new AdminReportTargetDTO.MessagePreview(
                        report.getMessageId(), report.getSenderUsername(), report.getReportedText(), report.getAttachmentCount()));
            }
            case POST -> {
                var post = find(PostReport.class, id, false).getPost();
                yield new AdminReportTargetDTO(postSupport.toResponse(post, userService.getCurrentUser()), null, null);
            }
            case COMMENT -> {
                var comment = find(CommentReport.class, id, false).getComment();
                var actor = userService.getCurrentUser();
                List<CommentAttachmentDTO> attachments = comment.getStatus() == CommentStatus.VISIBLE
                        ? commentSupport.toResponse(comment, actor).getAttachments() : List.of();
                var preview = new AdminReportTargetDTO.CommentPreview(comment.getId(),
                        comment.getUser().getUsername(),
                        comment.getStatus() == CommentStatus.DELETED ? null : comment.getContent(),
                        comment.getStatus(), attachments);
                yield new AdminReportTargetDTO(
                        postSupport.toResponse(comment.getPost(), actor), preview, null);
            }
            case COMMUNITY -> {
                var community = find(CommunityReport.class, id, false).getCommunity();
                yield new AdminReportTargetDTO(null, null, communityService.getCommunityDetailById(community.getId()));
            }
        };
    }

    @HasRole("ADMIN")
    @Transactional
    public ReportResponseDTO review(ReportTargetType type, Long id, ReportStatus status, String note,
                                    ReportModerationAction action) {
        return review(type, id, status, note, userService.getCurrentUser(), null, action);
    }

    @Transactional
    public ReportResponseDTO reviewForCommunity(
            String communityName, ReportTargetType type, Long id, ReportStatus status, String note) {
        if (type != ReportTargetType.POST && type != ReportTargetType.COMMENT) {
            throw new ReportException(ReportErrorCode.INVALID_COMMUNITY_REPORT_TYPE);
        }
        User actor = userService.getCurrentUser();
        Community community = communitySupport.getCommunityByName(communityName);
        communityAuthorization.requireOwner(community, actor);
        return review(type, id, status, note, actor, community, ReportModerationAction.REVIEWED);
    }

    private ReportResponseDTO review(
            ReportTargetType type, Long id, ReportStatus status, String note, User actor, Community community,
            ReportModerationAction moderationAction) {
        if (status != ReportStatus.RESOLVED && status != ReportStatus.REJECTED) {
            throw new ReportException(ReportErrorCode.INVALID_REPORT_STATUS);
        }
        if (note == null || note.isBlank() || note.length() > 2000) {
            throw new ReportException(ReportErrorCode.INVALID_REVIEW_NOTE);
        }
        String resolutionNote = note.strip();
        LocalDateTime now = LocalDateTime.now();
        String action = status == ReportStatus.RESOLVED ? moderationAction.name() : "REJECTED";
        return switch (type) {
            case MESSAGE -> {
                var report = find(ChatMessageReport.class, id, true);
                requirePending(report.getStatus());
                report.setStatus(status);
                report.setHandledBy(actor);
                report.setHandledAt(now);
                report.setResolutionNote(resolutionNote);
                report.setAction(action);
                notificationEvents.enqueueReportReviewedNotification(actor.getId(), id, type, report.getReporter().getId(), status);
                yield mapper.toResponse(report);
            }
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
                notificationEvents.enqueueReportReviewedNotification(actor.getId(), id, type, report.getUser().getId(), status);
                if (community == null && status == ReportStatus.RESOLVED) {
                    Post post = report.getPost();
                    notificationEvents.enqueueReportWarningNotification(actor.getId(), id, type, post.getUser().getId(),
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
                notificationEvents.enqueueReportReviewedNotification(actor.getId(), id, type, report.getReporter().getId(), status);
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
                notificationEvents.enqueueReportReviewedNotification(actor.getId(), id, type, report.getUser().getId(), status);
                Community reportedCommunity = report.getCommunity();
                if (status == ReportStatus.RESOLVED && reportedCommunity.getOwner() != null) {
                    notificationEvents.enqueueReportWarningNotification(actor.getId(), id, type, reportedCommunity.getOwner().getId(),
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

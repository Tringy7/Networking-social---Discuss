package com.discuss.discuss.service.admin;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.report.AdminReportTargetDTO;
import com.discuss.discuss.dto.report.ReportResponseDTO;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.exception.report.ReportErrorCode;
import com.discuss.discuss.exception.report.ReportException;
import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.service.comment.CommentService;
import com.discuss.discuss.service.report.*;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
@RequiredArgsConstructor
@HasRole("ADMIN")
public class AdminReportService {
    private final PostReportQueryService postReports;
    private final CommentReportQueryService commentReports;
    private final CommunityReportQueryService communityReports;
    private final ReportReviewService reviewService;
    private final ActivityLogService activityLogService;
    private final AdminPostService adminPostService;
    private final AdminCommunityService adminCommunityService;
    private final CommentService commentService;

    public PageResponseDTO<ReportResponseDTO> list(ReportTargetType type, ReportStatus status, String communityName, Pageable pageable) {
        return switch (type) {
            case POST -> postReports.list(status, communityName, pageable);
            case COMMENT -> commentReports.list(status, communityName, pageable);
            case COMMUNITY -> communityReports.list(status, communityName, pageable);
        };
    }

    public ReportResponseDTO getDetail(ReportTargetType type, Long id) { return reviewService.getDetail(type, id); }

    public AdminReportTargetDTO getTarget(ReportTargetType type, Long id) { return reviewService.getTarget(type, id); }

    @Transactional
    public ReportResponseDTO review(ReportTargetType type, Long id, ReportStatus status, String note,
                                    ReportModerationAction requestedAction) {
        var action = requestedAction == null ? ReportModerationAction.REVIEWED : requestedAction;
        var allowedAction = switch (type) {
            case POST -> ReportModerationAction.REMOVE_POST;
            case COMMENT -> ReportModerationAction.REMOVE_COMMENT;
            case COMMUNITY -> ReportModerationAction.LOCK_COMMUNITY;
        };
        if (action != ReportModerationAction.REVIEWED && (status != ReportStatus.RESOLVED || action != allowedAction)) {
            throw new ReportException(ReportErrorCode.INVALID_MODERATION_ACTION);
        }

        var result = reviewService.review(type, id, status, note, action);
        switch (action) {
            case REMOVE_POST -> adminPostService.delete(result.targetId());
            case REMOVE_COMMENT -> {
                if (commentService.deleteForAdmin(result.targetId())) {
                    activityLogService.record("DELETE_COMMENT", "COMMENT", result.targetId(), null);
                }
            }
            case LOCK_COMMUNITY -> adminCommunityService.lockCommunity(result.targetId());
            case REVIEWED -> { }
        }
        activityLogService.record(status == ReportStatus.RESOLVED ? "RESOLVE_REPORT" : "REJECT_REPORT", type.name() + "_REPORT", id, note.strip());
        return result;
    }
}

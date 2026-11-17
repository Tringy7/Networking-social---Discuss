package com.discuss.discuss.service.admin;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.report.ReportResponseDTO;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.service.report.*;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @RequiredArgsConstructor @HasRole("ADMIN")
public class AdminReportService {
    private final PostReportQueryService postReports;
    private final CommentReportQueryService commentReports;
    private final CommunityReportQueryService communityReports;
    private final ReportReviewService reviewService;
    private final ActivityLogService activityLogService;
    public PageResponseDTO<ReportResponseDTO> list(ReportTargetType type, ReportStatus status, String communityName, Pageable pageable) {
        return switch (type) {
            case POST -> postReports.list(status, communityName, pageable);
            case COMMENT -> commentReports.list(status, communityName, pageable);
            case COMMUNITY -> communityReports.list(status, communityName, pageable);
        };
    }
    public ReportResponseDTO getDetail(ReportTargetType type, Long id) { return reviewService.getDetail(type, id); }
    @Transactional
    public ReportResponseDTO review(ReportTargetType type, Long id, ReportStatus status, String note) {
        var result = reviewService.review(type, id, status, note);
        activityLogService.record(status == ReportStatus.RESOLVED ? "RESOLVE_REPORT" : "REJECT_REPORT", type.name() + "_REPORT", id, note.strip());
        return result;
    }
}

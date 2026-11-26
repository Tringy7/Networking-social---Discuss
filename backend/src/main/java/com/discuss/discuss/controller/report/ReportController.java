package com.discuss.discuss.controller.report;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.report.CreateReportRequestDTO;
import com.discuss.discuss.dto.report.MyReportResponseDTO;
import com.discuss.discuss.dto.report.ReportQueryRequestDTO;
import com.discuss.discuss.dto.report.ReportResponseDTO;
import com.discuss.discuss.dto.report.ReviewReportRequestDTO;
import com.discuss.discuss.enums.ReportStatus;
import com.discuss.discuss.enums.ReportTargetType;
import com.discuss.discuss.exception.report.ReportErrorCode;
import com.discuss.discuss.exception.report.ReportException;
import com.discuss.discuss.service.report.CommentReportQueryService;
import com.discuss.discuss.service.report.PostReportQueryService;
import com.discuss.discuss.service.report.ReportReviewService;
import com.discuss.discuss.service.report.ReportService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Validated
public class ReportController {
    private final ReportService reportService;
    private final PostReportQueryService postReportQueries;
    private final CommentReportQueryService commentReportQueries;
    private final ReportReviewService reportReviewService;

    @GetMapping("/reports/me")
    public ResponseEntity<PageResponseDTO<MyReportResponseDTO>> listMyReports(
            @RequestParam(defaultValue = "POST") ReportTargetType type,
            @Valid @ModelAttribute ReportQueryRequestDTO request) {
        return ResponseEntity.ok(reportService.listMine(type, request.getStatus(), request.toPageable()));
    }

    @PatchMapping({"/communities/{name}/reports/{type}/{reportId}/resolve", "/reports/community/{name}/{type}/{reportId}/resolve"})
    public ResponseEntity<ReportResponseDTO> resolveCommunityReport(
            @PathVariable @Size(min = 1, max = 255) String name,
            @PathVariable ReportTargetType type,
            @PathVariable @Positive Long reportId,
            @Valid @RequestBody ReviewReportRequestDTO request) {
        return ResponseEntity.ok(reportReviewService.reviewForCommunity(
                name, type, reportId, ReportStatus.RESOLVED, request.resolutionNote()));
    }

    @PatchMapping({"/communities/{name}/reports/{type}/{reportId}/reject", "/reports/community/{name}/{type}/{reportId}/reject"})
    public ResponseEntity<ReportResponseDTO> rejectCommunityReport(
            @PathVariable @Size(min = 1, max = 255) String name,
            @PathVariable ReportTargetType type,
            @PathVariable @Positive Long reportId,
            @Valid @RequestBody ReviewReportRequestDTO request) {
        return ResponseEntity.ok(reportReviewService.reviewForCommunity(
                name, type, reportId, ReportStatus.REJECTED, request.resolutionNote()));
    }

    @GetMapping("/communities/{name}/reports")
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> listCommunityReports(
            @PathVariable @Size(min = 1, max = 255) String name,
            @RequestParam ReportTargetType type,
            @Valid @ModelAttribute ReportQueryRequestDTO request) {
        return switch (type) {
            case POST -> getCommunityPostReports(name, request);
            case COMMENT -> getCommunityCommentReports(name, request);
            case COMMUNITY -> throw new ReportException(ReportErrorCode.INVALID_COMMUNITY_REPORT_TYPE);
        };
    }

    @GetMapping("/reports/community/{name}/posts")
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> getCommunityPostReports(
            @PathVariable @Size(min = 1, max = 255) String name,
            @Valid @ModelAttribute ReportQueryRequestDTO request) {
        return ResponseEntity.ok(postReportQueries.listForCommunity(name, request.getStatus(), request.toPageable()));
    }

    @GetMapping("/reports/community/{name}/comments")
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> getCommunityCommentReports(
            @PathVariable @Size(min = 1, max = 255) String name,
            @Valid @ModelAttribute ReportQueryRequestDTO request) {
        return ResponseEntity.ok(commentReportQueries.listForCommunity(name, request.getStatus(), request.toPageable()));
    }

    @PostMapping("/reports")
    public ResponseEntity<ReportResponseDTO> create(@Valid @RequestBody CreateReportRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.create(request));
    }
}

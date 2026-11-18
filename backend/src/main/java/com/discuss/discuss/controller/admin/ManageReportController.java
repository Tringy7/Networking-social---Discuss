package com.discuss.discuss.controller.admin;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.report.ReportQueryRequestDTO;
import com.discuss.discuss.dto.report.ReportResponseDTO;
import com.discuss.discuss.dto.report.ReviewReportRequestDTO;
import com.discuss.discuss.enums.ReportStatus;
import com.discuss.discuss.enums.ReportTargetType;
import com.discuss.discuss.service.admin.AdminReportService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Validated
@HasRole("ADMIN")
public class ManageReportController {
    private final AdminReportService adminReportService;

    @GetMapping("/admin/reports")
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> list(
            @RequestParam ReportTargetType type,
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) @Size(max = 255) String communityName,
            @PageableDefault(size = 10, sort = {"createdAt", "id"}, direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminReportService.list(type, status, communityName, pageable));
    }

    // Preserve the original list routes for existing API clients.
    @GetMapping("/reports/posts")
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> getPostReports(
            @Valid @ModelAttribute ReportQueryRequestDTO request,
            @RequestParam(required = false) @Size(max = 255) String communityName) {
        return ResponseEntity.ok(adminReportService.list(ReportTargetType.POST, request.getStatus(), communityName, request.toPageable()));
    }

    @GetMapping("/reports/comments")
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> getCommentReports(
            @Valid @ModelAttribute ReportQueryRequestDTO request,
            @RequestParam(required = false) @Size(max = 255) String communityName) {
        return ResponseEntity.ok(adminReportService.list(ReportTargetType.COMMENT, request.getStatus(), communityName, request.toPageable()));
    }

    @GetMapping("/reports/communities")
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> getCommunityReports(
            @Valid @ModelAttribute ReportQueryRequestDTO request,
            @RequestParam(required = false) @Size(max = 255) String communityName) {
        return ResponseEntity.ok(adminReportService.list(ReportTargetType.COMMUNITY, request.getStatus(), communityName, request.toPageable()));
    }

    @GetMapping("/admin/reports/{type}/{reportId}")
    public ResponseEntity<ReportResponseDTO> detail(@PathVariable ReportTargetType type, @PathVariable @Positive Long reportId) {
        return ResponseEntity.ok(adminReportService.getDetail(type, reportId));
    }

    @PatchMapping("/admin/reports/{type}/{reportId}/resolve")
    public ResponseEntity<ReportResponseDTO> resolve(@PathVariable ReportTargetType type, @PathVariable @Positive Long reportId,
            @Valid @RequestBody ReviewReportRequestDTO request) {
        return ResponseEntity.ok(adminReportService.review(type, reportId, ReportStatus.RESOLVED, request.resolutionNote()));
    }

    @PatchMapping("/admin/reports/{type}/{reportId}/reject")
    public ResponseEntity<ReportResponseDTO> reject(@PathVariable ReportTargetType type, @PathVariable @Positive Long reportId,
            @Valid @RequestBody ReviewReportRequestDTO request) {
        return ResponseEntity.ok(adminReportService.review(type, reportId, ReportStatus.REJECTED, request.resolutionNote()));
    }
}

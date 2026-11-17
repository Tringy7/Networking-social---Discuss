package com.discuss.discuss.controller.admin;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.report.*;
import com.discuss.discuss.enums.*;
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
@RestController @RequestMapping("/admin/reports")
@RequiredArgsConstructor @Validated @HasRole("ADMIN")
public class ManageReportController {
    private final AdminReportService service;
    @GetMapping
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> list(
            @RequestParam ReportTargetType type,
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) @Size(max = 255) String communityName,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(service.list(type, status, communityName, pageable));
    }
    @GetMapping("/{type}/{reportId}")
    public ResponseEntity<ReportResponseDTO> detail(@PathVariable ReportTargetType type, @PathVariable @Positive Long reportId) {
        return ResponseEntity.ok(service.getDetail(type, reportId));
    }
    @PatchMapping("/{type}/{reportId}/resolve")
    public ResponseEntity<ReportResponseDTO> resolve(@PathVariable ReportTargetType type, @PathVariable @Positive Long reportId,
            @Valid @RequestBody ReviewReportRequestDTO request) {
        return ResponseEntity.ok(service.review(type, reportId, ReportStatus.RESOLVED, request.resolutionNote()));
    }
    @PatchMapping("/{type}/{reportId}/reject")
    public ResponseEntity<ReportResponseDTO> reject(@PathVariable ReportTargetType type, @PathVariable @Positive Long reportId,
            @Valid @RequestBody ReviewReportRequestDTO request) {
        return ResponseEntity.ok(service.review(type, reportId, ReportStatus.REJECTED, request.resolutionNote()));
    }
}

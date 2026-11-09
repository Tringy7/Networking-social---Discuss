package com.discuss.discuss.controller.report;

import com.discuss.discuss.dto.report.*;
import com.discuss.discuss.service.report.ReportService;
import com.discuss.discuss.service.report.ReportQueryService;
import com.discuss.discuss.dto.common.PageResponseDTO;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Validated
public class ReportController {
    private final ReportService reportService;
    private final ReportQueryService reportQueryService;

    @GetMapping
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> getListReports(
            @Valid @ModelAttribute ReportQueryRequestDTO request,
            @RequestParam(required = false) @Size(max = 255) String communityName) {
        return ResponseEntity.ok(reportQueryService.getListReports(
                request.getStatus(), request.getTargetType(), communityName, request.toPageable()));
    }

    @GetMapping("/community/{name}")
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> getCommunityReports(
            @PathVariable @Size(min = 1, max = 255) String name,
            @Valid @ModelAttribute ReportQueryRequestDTO request) {
        return ResponseEntity.ok(reportQueryService.getCommunityReports(
                name, request.getStatus(), request.getTargetType(), request.toPageable()));
    }

    @PostMapping
    public ResponseEntity<ReportResponseDTO> create(@Valid @RequestBody CreateReportRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.create(request));
    }
}

package com.discuss.discuss.controller.report;

import com.discuss.discuss.dto.report.*;
import com.discuss.discuss.service.report.ReportService;
import com.discuss.discuss.service.report.ReportQueryService;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.enums.ReportStatus;
import com.discuss.discuss.enums.ReportTargetType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.PageRequest;
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
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(required = false) ReportTargetType targetType,
            @RequestParam(required = false) @Size(max = 255) String communityName,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(reportQueryService.getListReports(status, targetType, communityName,
                PageRequest.of(page, size)));
    }

    @PostMapping
    public ResponseEntity<ReportResponseDTO> create(@Valid @RequestBody CreateReportRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.create(request));
    }
}

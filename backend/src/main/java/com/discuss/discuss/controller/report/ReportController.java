package com.discuss.discuss.controller.report;

import com.discuss.discuss.dto.report.*;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.service.report.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Validated
public class ReportController {
    private final ReportService reportService;
    private final PostReportQueryService postReportQueries;
    private final CommentReportQueryService commentReportQueries;
    private final CommunityReportQueryService communityReportQueries;

    @GetMapping("/posts")
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> getPostReports(
            @Valid @ModelAttribute ReportQueryRequestDTO request,
            @RequestParam(required = false) @Size(max = 255) String communityName) {
        return ResponseEntity.ok(postReportQueries.list(request.getStatus(), communityName, request.toPageable()));
    }

    @GetMapping("/community/{name}/posts")
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> getCommunityPostReports(
            @PathVariable @Size(min = 1, max = 255) String name,
            @Valid @ModelAttribute ReportQueryRequestDTO request) {
        return ResponseEntity.ok(postReportQueries.listForCommunity(name, request.getStatus(), request.toPageable()));
    }

    @GetMapping("/comments")
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> getCommentReports(
            @Valid @ModelAttribute ReportQueryRequestDTO request,
            @RequestParam(required = false) @Size(max = 255) String communityName) {
        return ResponseEntity.ok(commentReportQueries.list(request.getStatus(), communityName, request.toPageable()));
    }

    @GetMapping("/community/{name}/comments")
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> getCommunityCommentReports(
            @PathVariable @Size(min = 1, max = 255) String name,
            @Valid @ModelAttribute ReportQueryRequestDTO request) {
        return ResponseEntity.ok(commentReportQueries.listForCommunity(name, request.getStatus(), request.toPageable()));
    }

    @GetMapping("/communities")
    public ResponseEntity<PageResponseDTO<ReportResponseDTO>> getCommunityReports(
            @Valid @ModelAttribute ReportQueryRequestDTO request,
            @RequestParam(required = false) @Size(max = 255) String communityName) {
        return ResponseEntity.ok(communityReportQueries.list(request.getStatus(), communityName, request.toPageable()));
    }

    @PostMapping
    public ResponseEntity<ReportResponseDTO> create(@Valid @RequestBody CreateReportRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.create(request));
    }
}

package com.discuss.discuss.dto.report;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record ReviewReportRequestDTO(@NotBlank @Size(max = 2000) String resolutionNote) {}

package com.discuss.discuss.dto.report;
import com.discuss.discuss.enums.ReportModerationAction;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public record ReviewReportRequestDTO(
        @NotBlank @Size(max = 2000) String resolutionNote,
        ReportModerationAction action
) {}

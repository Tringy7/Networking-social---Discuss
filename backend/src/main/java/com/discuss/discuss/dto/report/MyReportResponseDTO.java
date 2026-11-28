package com.discuss.discuss.dto.report;

import com.discuss.discuss.enums.ReportStatus;
import com.discuss.discuss.enums.ReportTargetType;
import java.time.LocalDateTime;

public record MyReportResponseDTO(
        Long id, ReportTargetType targetType, Long targetId, String communityName,
        String reason, String description, ReportStatus status, LocalDateTime createdAt, LocalDateTime resolvedAt
) {}

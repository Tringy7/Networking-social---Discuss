package com.discuss.discuss.dto.report;

import com.discuss.discuss.enums.*;
import java.time.LocalDateTime;

public record ReportResponseDTO(Long id, ReportTargetType targetType, Long targetId,
        String communityName, String reporterUsername, ReportReason reason, String description,
        ReportStatus status, String action, String resolutionNote, String resolvedBy,
        LocalDateTime resolvedAt, LocalDateTime createdAt) {}

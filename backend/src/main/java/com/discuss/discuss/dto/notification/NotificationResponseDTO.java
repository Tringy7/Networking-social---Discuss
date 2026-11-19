package com.discuss.discuss.dto.notification;

import com.discuss.discuss.enums.NotificationType;
import com.discuss.discuss.enums.ReportStatus;
import com.discuss.discuss.enums.ReportTargetType;
import java.time.LocalDateTime;

public record NotificationResponseDTO(
        Long id,
        NotificationType type,
        Actor actor,
        Long postId,
        Long commentId,
        boolean read,
        LocalDateTime createdAt,
        String communityName,
        Long reportId,
        ReportTargetType reportTargetType,
        ReportStatus reportStatus
) {
    public record Actor(String username, String displayName, String avatarUrl) {}
}

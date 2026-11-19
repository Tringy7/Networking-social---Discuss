package com.discuss.discuss.dto.notification;

import com.discuss.discuss.enums.NotificationType;
import java.time.LocalDateTime;

public record NotificationResponseDTO(
        Long id,
        NotificationType type,
        Actor actor,
        Long postId,
        Long commentId,
        boolean read,
        LocalDateTime createdAt
) {
    public record Actor(String username, String displayName, String avatarUrl) {}
}

package com.discuss.discuss.dto.admin;

import java.time.LocalDateTime;

public record AdminActivityLogResponseDTO(Long id, Long actorUserId, String actorUsername,
        String action, String targetType, Long targetId, String note, LocalDateTime createdAt) {}

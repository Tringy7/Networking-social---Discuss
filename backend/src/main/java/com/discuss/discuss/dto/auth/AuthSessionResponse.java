package com.discuss.discuss.dto.auth;
import java.time.Instant;
public record AuthSessionResponse(String id, String deviceName, Instant createdAt,
        Instant lastActiveAt, Instant expiresAt, boolean current) {}

package com.discuss.discuss.dto.user;

public record UserSearchResultDTO(
        String id,
        String username,
        String displayName,
        String bio,
        String avatarUrl
) {}

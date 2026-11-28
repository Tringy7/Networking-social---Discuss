package com.discuss.discuss.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public final class AdminResponse {
    private AdminResponse() {}

    public record Data<T>(T data) {}
    public record StatusCounts(long total, long active, long suspended) {}
    public record Total(long total) {}
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Stats {
        private StatusCounts users;
        private StatusCounts communities;
        private Total posts;
        private Total comments;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserItem {
        private Long id;
        private String username;
        private String email;
        private String displayName;
        private String avatarUrl;
        private String role;
        private String status;
        private LocalDateTime createdAt;
    }
}

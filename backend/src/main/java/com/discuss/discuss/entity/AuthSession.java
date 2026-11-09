package com.discuss.discuss.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "auth_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthSession {
    @Id
    @Column(length = 36)
    private String id;
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false, length = 160)
    private String deviceName;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant lastActiveAt;
    @Column(nullable = false)
    private Instant expiresAt;
    @Column(nullable = false)
    private boolean revoked;
}

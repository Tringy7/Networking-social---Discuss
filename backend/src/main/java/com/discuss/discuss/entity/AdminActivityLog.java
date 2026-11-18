package com.discuss.discuss.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
@Entity
@Table(name = "admin_activity_logs", indexes = {
        @Index(name = "idx_admin_activity_created", columnList = "created_at"),
        @Index(name = "idx_admin_activity_actor", columnList = "actor_user_id")})
@Getter @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminActivityLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "actor_user_id", nullable = false, updatable = false)
    private Long actorUserId;
    @Column(nullable = false, updatable = false)
    private String actorUsername;
    @Column(nullable = false, updatable = false, length = 80)
    private String action;
    @Column(nullable = false, updatable = false, length = 40)
    private String targetType;
    @Column(nullable = false, updatable = false)
    private Long targetId;
    @Column(updatable = false, length = 2000)
    private String note;
    @CreationTimestamp @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

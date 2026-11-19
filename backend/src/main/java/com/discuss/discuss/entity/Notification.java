package com.discuss.discuss.entity;

import com.discuss.discuss.enums.NotificationType;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "notifications",
        indexes = {
            @Index(name = "idx_notifications_recipient_created", columnList = "recipient_id, created_at, id"),
            @Index(name = "idx_notifications_recipient_read", columnList = "recipient_id, read_at")
        },
        uniqueConstraints = @UniqueConstraint(name = "uk_notifications_recipient_comment",
                columnNames = {"recipient_id", "comment_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private NotificationType type;

    @Column(nullable = false)
    private Long postId;

    @Column(name = "comment_id")
    private Long commentId;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

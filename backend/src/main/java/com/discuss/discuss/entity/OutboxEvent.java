package com.discuss.discuss.entity;

import com.discuss.discuss.enums.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "outbox_events", indexes = @Index(
        name = "idx_outbox_due", columnList = "status, next_attempt_at, id"))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboxEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 64)
    private NotificationEventType eventType;

    @Column(nullable = false)
    private Long actorId;

    private Long postId;
    private Long commentId;
    private Long communityId;
    private Long reportId;
    private Long reporterId;
    private Long warningRecipientId;

    @Enumerated(EnumType.STRING)
    private ReportTargetType reportTargetType;

    @Enumerated(EnumType.STRING)
    private ReportStatus reportStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OutboxStatus status;

    @Column(nullable = false)
    private int attemptCount;

    @Column(nullable = false)
    private LocalDateTime nextAttemptAt;

    @Column(length = 500)
    private String lastError;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime processedAt;
}

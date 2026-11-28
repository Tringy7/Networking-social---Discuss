package com.discuss.discuss.entity;

import com.discuss.discuss.enums.ReportStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "chat_message_reports", indexes = @Index(columnList = "message_id,reporter_id,status"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long messageId;
    @Column(nullable = false, length = 30)
    private String senderUsername;
    @Column(nullable = false, length = 4000)
    private String reportedText;
    private int attachmentCount;

    @ManyToOne
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status;

    @ManyToOne
    @JoinColumn(name = "handled_by")
    private User handledBy;

    private LocalDateTime handledAt;

    @Column(length = 2000)
    private String resolutionNote;

    @Column(length = 40)
    private String action;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}

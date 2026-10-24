package com.discuss.discuss.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ban_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BanHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "community_id", nullable = false)
    private Community community;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "moderator_id", nullable = false)
    private User moderator;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}

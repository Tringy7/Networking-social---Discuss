package com.discuss.discuss.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "community_join_requests", indexes = {
        @Index(columnList = "community_id,status,requested_at"),
        @Index(columnList = "community_id,applicant_id,status")
})
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class CommunityJoinRequest {

    public enum Status { PENDING, APPROVED, REJECTED, CLOSED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "community_id", nullable = false)
    private Community community;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "applicant_id", nullable = false)
    private User applicant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime reviewedAt;

    public CommunityJoinRequest(Community community, User applicant) {
        this.community = community;
        this.applicant = applicant;
        this.status = Status.PENDING;
        this.requestedAt = LocalDateTime.now();
    }

    public void review(User reviewer, boolean approved) {
        this.reviewer = reviewer;
        this.status = approved ? Status.APPROVED : Status.REJECTED;
        this.reviewedAt = LocalDateTime.now();
    }

    public void close() {
        this.status = Status.CLOSED;
    }
}

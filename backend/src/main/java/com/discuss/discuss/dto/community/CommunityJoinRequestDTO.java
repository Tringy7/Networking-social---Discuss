package com.discuss.discuss.dto.community;

import com.discuss.discuss.entity.CommunityJoinRequest;
import com.discuss.discuss.entity.CommunityJoinRequest.Status;

import java.time.LocalDateTime;

public record CommunityJoinRequestDTO(
        Long id, Long applicantId, String applicantUsername, Status status,
        LocalDateTime requestedAt, Long reviewerId, String reviewerUsername, LocalDateTime reviewedAt
) {
    public static CommunityJoinRequestDTO from(CommunityJoinRequest request) {
        var reviewer = request.getReviewer();
        return new CommunityJoinRequestDTO(
                request.getId(), request.getApplicant().getId(), request.getApplicant().getUsername(),
                request.getStatus(), request.getRequestedAt(), reviewer == null ? null : reviewer.getId(),
                reviewer == null ? null : reviewer.getUsername(), request.getReviewedAt());
    }
}

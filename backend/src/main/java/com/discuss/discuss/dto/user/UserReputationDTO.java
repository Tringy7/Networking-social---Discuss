package com.discuss.discuss.dto.user;

public record UserReputationDTO(long score, Rank rank, boolean hasReputationBadge) {
    public enum Rank {
        MEMBER, CONTRIBUTOR, TRUSTED, HIGHLY_TRUSTED
    }
}

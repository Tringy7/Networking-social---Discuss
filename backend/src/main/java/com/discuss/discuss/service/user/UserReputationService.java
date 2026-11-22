package com.discuss.discuss.service.user;

import com.discuss.discuss.dto.admin.ReputationThresholdsDTO;
import com.discuss.discuss.dto.user.UserReputationDTO;
import com.discuss.discuss.dto.user.UserReputationDTO.Rank;
import com.discuss.discuss.entity.ReputationSettings;
import com.discuss.discuss.enums.CommentStatus;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.VoteType;
import com.discuss.discuss.repository.CommentVoteRepository;
import com.discuss.discuss.repository.PostVoteRepository;
import com.discuss.discuss.repository.ReputationSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserReputationService {
    private static final ReputationThresholdsDTO DEFAULT_THRESHOLDS = new ReputationThresholdsDTO(50, 150, 400);

    private final PostVoteRepository postVotes;
    private final CommentVoteRepository commentVotes;
    private final ReputationSettingsRepository settings;

    @Transactional(readOnly = true)
    public UserReputationDTO getReputation(Long userId) {
        long score = 2 * countPostVotes(userId, VoteType.UP) - countPostVotes(userId, VoteType.DOWN)
                + countCommentVotes(userId, VoteType.UP) - countCommentVotes(userId, VoteType.DOWN);
        ReputationThresholdsDTO thresholds = getThresholds();
        return new UserReputationDTO(score, resolveRank(score, thresholds), score >= thresholds.trusted());
    }

    private long countPostVotes(Long authorId, VoteType voteType) {
        return postVotes.countByPost_User_IdAndUser_IdNotAndPost_StatusAndPost_Community_StatusAndVoteType(
                authorId, authorId, PostStatus.PUBLISHED, CommunityStatus.ACTIVE, voteType);
    }

    private long countCommentVotes(Long authorId, VoteType voteType) {
        return commentVotes.countByComment_User_IdAndUser_IdNotAndComment_StatusAndComment_Post_StatusAndComment_Post_Community_StatusAndVoteType(
                authorId, authorId, CommentStatus.VISIBLE, PostStatus.PUBLISHED, CommunityStatus.ACTIVE, voteType);
    }

    public ReputationThresholdsDTO getThresholds() {
        return settings.findById(ReputationSettings.SYSTEM_ID)
                .map(row -> new ReputationThresholdsDTO(row.getContributorThreshold(),
                        row.getTrustedThreshold(), row.getHighlyTrustedThreshold()))
                .orElse(DEFAULT_THRESHOLDS);
    }

    private Rank resolveRank(long score, ReputationThresholdsDTO thresholds) {
        if (score >= thresholds.highlyTrusted()) return Rank.HIGHLY_TRUSTED;
        if (score >= thresholds.trusted()) return Rank.TRUSTED;
        if (score >= thresholds.contributor()) return Rank.CONTRIBUTOR;
        return Rank.MEMBER;
    }
}

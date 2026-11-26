package com.discuss.discuss.service.user;

import com.discuss.discuss.dto.user.UserReputationDTO.Rank;
import com.discuss.discuss.enums.CommentStatus;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.VoteType;
import com.discuss.discuss.repository.CommentVoteRepository;
import com.discuss.discuss.repository.PostVoteRepository;
import com.discuss.discuss.repository.ReputationSettingsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserReputationServiceTest {
    private final PostVoteRepository postVotes = mock(PostVoteRepository.class);
    private final CommentVoteRepository commentVotes = mock(CommentVoteRepository.class);
    private final UserReputationService reputation =
            new UserReputationService(postVotes, commentVotes, mock(ReputationSettingsRepository.class));

    @ParameterizedTest
    @CsvSource({"24, MEMBER, false", "25, CONTRIBUTOR, false", "75, TRUSTED, true", "200, HIGHLY_TRUSTED, true"})
    void appliesRankAtDefaultBoundaries(long upvotes, Rank rank, boolean trusted) {
        postVotes(VoteType.UP, upvotes);

        var result = reputation.getReputation(7L);

        assertThat(result).isEqualTo(new com.discuss.discuss.dto.user.UserReputationDTO(upvotes * 2, rank, trusted));
    }

    @Test
    void combinesWeightedPostAndCommentVotes() {
        postVotes(VoteType.UP, 4);
        postVotes(VoteType.DOWN, 2);
        commentVotes(VoteType.UP, 3);
        commentVotes(VoteType.DOWN, 1);

        assertThat(reputation.getReputation(7L))
                .isEqualTo(new com.discuss.discuss.dto.user.UserReputationDTO(8, Rank.MEMBER, false));
    }

    private void postVotes(VoteType type, long count) {
        when(postVotes.countByPost_User_IdAndUser_IdNotAndPost_StatusAndPost_Community_StatusAndVoteType(
                7L, 7L, PostStatus.PUBLISHED, CommunityStatus.ACTIVE, type)).thenReturn(count);
    }

    private void commentVotes(VoteType type, long count) {
        when(commentVotes.countByComment_User_IdAndUser_IdNotAndComment_StatusAndComment_Post_StatusAndComment_Post_Community_StatusAndVoteType(
                7L, 7L, CommentStatus.VISIBLE, PostStatus.PUBLISHED, CommunityStatus.ACTIVE, type)).thenReturn(count);
    }
}

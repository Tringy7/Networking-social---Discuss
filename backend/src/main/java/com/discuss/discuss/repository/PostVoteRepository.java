package com.discuss.discuss.repository;

import com.discuss.discuss.entity.PostVote;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.VoteType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PostVoteRepository extends JpaRepository<PostVote, Long> {
    long countByPost_User_IdAndUser_IdNotAndPost_StatusAndPost_Community_StatusAndVoteType(
            Long authorId, Long excludedVoterId, PostStatus postStatus, CommunityStatus communityStatus, VoteType voteType);

    Optional<PostVote> findByPostIdAndUserId(Long postId, Long userId);
}

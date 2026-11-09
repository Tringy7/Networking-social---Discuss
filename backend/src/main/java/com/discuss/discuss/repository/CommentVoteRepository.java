package com.discuss.discuss.repository;

import com.discuss.discuss.entity.CommentVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface CommentVoteRepository extends JpaRepository<CommentVote, Long> {
    Optional<CommentVote> findByCommentIdAndUserId(Long commentId, Long userId);

    @Query("select coalesce(sum(case when v.voteType = com.discuss.discuss.enums.VoteType.UP then 1 else -1 end), 0) from CommentVote v where v.comment.id = :commentId")
    long voteScore(Long commentId);
}

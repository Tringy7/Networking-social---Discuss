package com.discuss.discuss.repository;

import com.discuss.discuss.entity.PostVote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PostVoteRepository extends JpaRepository<PostVote, Long> {
    Optional<PostVote> findByPostIdAndUserId(Long postId, Long userId);
}

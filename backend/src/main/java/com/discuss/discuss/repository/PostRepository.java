package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Post;
import com.discuss.discuss.enums.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Post> {
    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Post p where p.id = :id")
    Optional<Post> lockById(Long id);

    @Query("select coalesce(sum(case when v.voteType = com.discuss.discuss.enums.VoteType.UP then 1 else -1 end), 0) from PostVote v where v.post.id = :id")
    long voteScore(Long id);

    @Query("select count(c) from Comment c where c.post.id = :id and c.status = com.discuss.discuss.enums.CommentStatus.VISIBLE")
    long countComments(Long id);

    Page<Post> findByUserIdAndStatus(Long userId, PostStatus status, Pageable pageable);
}

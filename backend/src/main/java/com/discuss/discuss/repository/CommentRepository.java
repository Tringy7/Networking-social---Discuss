package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Comment;
import org.springframework.data.jpa.repository.*;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    @EntityGraph(attributePaths = {"user", "user.profile", "parentComment", "post", "post.user"})
    List<Comment> findByPostIdOrderByCreatedAtAscIdAsc(Long postId);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Comment c where c.id = :id")
    Optional<Comment> lockById(Long id);
}

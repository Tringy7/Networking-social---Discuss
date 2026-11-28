package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Comment;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    @EntityGraph(attributePaths = {"user", "user.profile", "parentComment", "post", "post.user"})
    List<Comment> findByPostIdOrderByCreatedAtAscIdAsc(Long postId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Comment c where c.id = :id")
    Optional<Comment> lockById(Long id);
}

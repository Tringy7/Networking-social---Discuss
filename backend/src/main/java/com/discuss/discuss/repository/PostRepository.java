package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Post> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from Post p where p.id = :id")
    java.util.Optional<Post> lockById(Long id);
    @org.springframework.data.jpa.repository.Query("select count(v) from PostVote v where v.post.id = :id and v.voteType = com.discuss.discuss.enums.VoteType.UP")
    long countHearts(Long id);
    @org.springframework.data.jpa.repository.Query("select count(c) from Comment c where c.post.id = :id and c.status = com.discuss.discuss.enums.CommentStatus.VISIBLE")
    long countComments(Long id);
    @org.springframework.data.jpa.repository.Query("select count(v) from PostVote v where v.post.id = :id and v.user.id = :userId and v.voteType = com.discuss.discuss.enums.VoteType.UP")
    long countUserHeart(Long id, Long userId);
}

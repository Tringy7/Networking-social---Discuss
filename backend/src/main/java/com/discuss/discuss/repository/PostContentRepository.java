package com.discuss.discuss.repository;

import com.discuss.discuss.entity.PostContent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostContentRepository extends JpaRepository<PostContent, Long> {
    java.util.Optional<PostContent> findByPostId(Long postId);
}

package com.discuss.discuss.repository;

import com.discuss.discuss.entity.PostMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostMediaRepository extends JpaRepository<PostMedia, Long> {
    long countByPostId(Long postId);
    Optional<PostMedia> findByIdAndPostId(Long id, Long postId);
    List<PostMedia> findByPostIdOrderByDisplayOrderAsc(Long postId);

//    @Query("select coalesce(max(m.displayOrder), -1) from PostMedia m where m.postId = :postId")
//    int findMaxDisplayOrder(@Param("postId") Long postId);
}
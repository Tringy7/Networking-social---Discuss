package com.discuss.discuss.repository;

import com.discuss.discuss.entity.PostMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostMediaRepository extends JpaRepository<PostMedia, Long> {
    List<PostMedia> findByPostIdOrderByDisplayOrderAsc(Long postId);
    boolean existsByObjectKey(String objectKey);
    void deleteByPostId(Long postId);

//    @Query("select coalesce(max(m.displayOrder), -1) from PostMedia m where m.postId = :postId")
//    int findMaxDisplayOrder(@Param("postId") Long postId);
}

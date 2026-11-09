package com.discuss.discuss.repository;

import com.discuss.discuss.entity.PostSave;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PostSaveRepository extends JpaRepository<PostSave, Long> {
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    Optional<PostSave> findByPostIdAndUserId(Long postId, Long userId);
}

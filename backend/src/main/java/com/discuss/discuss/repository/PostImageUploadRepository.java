package com.discuss.discuss.repository;

import com.discuss.discuss.entity.PostImageUpload;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import java.time.LocalDateTime;
import java.util.*;

public interface PostImageUploadRepository extends JpaRepository<PostImageUpload, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from PostImageUpload u where u.objectKey = :key")
    Optional<PostImageUpload> lockByKey(String key);

    @Query("select u.objectKey from PostImageUpload u where u.expiresAt < :now order by u.expiresAt")
    List<String> findExpiredKeys(LocalDateTime now, Pageable pageable);
}

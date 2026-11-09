package com.discuss.discuss.repository;

import com.discuss.discuss.entity.AuthSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.*;

public interface AuthSessionRepository extends JpaRepository<AuthSession, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM AuthSession s WHERE s.id = :id")
    Optional<AuthSession> findForUpdate(@Param("id") String id);

    List<AuthSession> findByUser_IdAndRevokedFalseAndExpiresAtAfterOrderByLastActiveAtDesc(Long userId, Instant now);

    @Modifying
    @Query("UPDATE AuthSession s SET s.revoked = true WHERE s.user.id = :userId AND s.revoked = false")
    int revokeAllForUser(@Param("userId") Long userId);
}

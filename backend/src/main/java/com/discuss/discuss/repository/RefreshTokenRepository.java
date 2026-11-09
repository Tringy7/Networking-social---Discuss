package com.discuss.discuss.repository;

import com.discuss.discuss.entity.RefreshToken;
import com.discuss.discuss.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT token FROM RefreshToken token WHERE token.token = :tokenHash")
    Optional<RefreshToken> findByTokenForUpdate(@Param("tokenHash") String tokenHash);

    Optional<RefreshToken> findByToken(String tokenHash);
    List<RefreshToken> findByUser_IdAndRevokedFalse(Long userId);
    @Modifying
    @Query("UPDATE RefreshToken token SET token.revoked = true WHERE token.token = :tokenHash AND token.revoked = false")
    int revokeByTokenHash(@Param("tokenHash") String tokenHash);

    @Modifying
    @Query("UPDATE RefreshToken t SET t.revoked = true WHERE t.session.id = :id AND t.revoked = false")
    int revokeBySessionId(@Param("id") String id);

    void deleteByUser(User user);
}
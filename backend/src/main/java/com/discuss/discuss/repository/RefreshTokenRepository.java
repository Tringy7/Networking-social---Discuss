package com.discuss.discuss.repository;

import com.discuss.discuss.entity.RefreshToken;
import com.discuss.discuss.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String tokenHash);
    List<RefreshToken> findByUser_IdAndRevokedFalse(Long userId);
    void deleteByUser(User user);
}
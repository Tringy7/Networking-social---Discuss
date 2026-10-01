package com.discuss.discuss.repository;

import com.discuss.discuss.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
}

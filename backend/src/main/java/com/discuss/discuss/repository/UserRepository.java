package com.discuss.discuss.repository;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.OptionalInt;
import java.time.LocalDateTime;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByUsernameAndStatus(
            String username,
            UserStatus status
    );
    List<User> findByCreatedAtAfter(LocalDateTime createdAt);
}

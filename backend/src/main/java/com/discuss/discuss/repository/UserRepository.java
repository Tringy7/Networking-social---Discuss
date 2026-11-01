package com.discuss.discuss.repository;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    @EntityGraph(attributePaths = "profile")
    @Query("""
            SELECT u FROM User u
            LEFT JOIN u.profile p
            WHERE u.status = :status
              AND (LOWER(u.username) LIKE :pattern ESCAPE '!'
                   OR LOWER(p.displayName) LIKE :pattern ESCAPE '!')
            """)
    Page<User> searchByUsernameOrDisplayName(
            @Param("pattern") String pattern,
            @Param("status") UserStatus status,
            Pageable pageable
    );

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByUsernameAndStatus(
            String username,
            UserStatus status
    );
}

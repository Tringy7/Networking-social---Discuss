package com.discuss.discuss.repository;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.OptionalInt;

public interface UserRepository extends JpaRepository<User, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "profile")
    @org.springframework.data.jpa.repository.Query("select u from User u left join u.profile p where u.status = com.discuss.discuss.enums.UserStatus.ACTIVE and (locate(lower(:q), lower(u.username)) > 0 or locate(lower(:q), lower(p.displayName)) > 0)")
    org.springframework.data.domain.Page<User> searchActive(@org.springframework.data.repository.query.Param("q") String q,
            org.springframework.data.domain.Pageable pageable);

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByUsernameAndStatus(
            String username,
            UserStatus status
    );
}

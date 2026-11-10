package com.discuss.discuss.repository;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    long countByStatus(UserStatus status);

    @Override
    @EntityGraph(attributePaths = "profile")
    Page<User> findAll(Specification<User> specification, Pageable pageable);

    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByUsernameAndStatus(
            String username,
            UserStatus status
    );
}

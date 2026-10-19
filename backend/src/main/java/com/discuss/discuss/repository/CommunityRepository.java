package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Community;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommunityRepository extends JpaRepository<Community, Long> {
    boolean existsByName(String name);
    Optional<Community> findByName(String name);
}

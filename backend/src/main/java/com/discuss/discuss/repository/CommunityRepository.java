package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Community;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface CommunityRepository extends
        JpaRepository<Community, Long>,
        JpaSpecificationExecutor<Community> {
    boolean existsByName(String name);
    Optional<Community> findByName(String name);

    @Override
    @EntityGraph(attributePaths = {"info", "info.category"})
    Page<Community> findAll(Specification<Community> spec, Pageable pageable);
}

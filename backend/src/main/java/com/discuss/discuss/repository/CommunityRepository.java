package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.enums.CommunityStatus;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface CommunityRepository extends
        JpaRepository<Community, Long>,
        JpaSpecificationExecutor<Community> {
    boolean existsByName(String name);
    Optional<Community> findByName(String name);

    @Override
    @EntityGraph(attributePaths = {"info", "info.category"})
    Page<Community> findAll(Specification<Community> spec, Pageable pageable);

    @Query("""
    SELECT c
    FROM Community c
    JOIN c.info i
    JOIN i.category cat
    WHERE cat.slug = :slug
      AND i.status = :status
    """)
    Page<Community> findAllByCategorySlug(
            @Param("slug") String slug,
            @Param("status") CommunityStatus status,
            Pageable pageable
    );
}

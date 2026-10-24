package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CommunityRepository extends
        JpaRepository<Community, Long>,
        JpaSpecificationExecutor<Community> {

    boolean existsByName(String name);

    Optional<Community> findByName(String name);

    Page<Community> findByOwner(User owner, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"info", "info.category"})
    Page<Community> findAll(
            Specification<Community> spec,
            Pageable pageable
    );

    @Query("""
        SELECT c
        FROM Community c
        JOIN c.info i
        JOIN i.category cat
        WHERE cat.slug = :slug
          AND c.status = :status
        """)
    Page<Community> findAllByCategorySlug(
            @Param("slug") String slug,
            @Param("status") CommunityStatus status,
            Pageable pageable
    );
}

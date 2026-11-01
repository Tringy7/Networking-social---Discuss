package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Category;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.enums.CommunityStatus;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.Set;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c.slug FROM Category c")
    Set<String> findAllSlugs();
}

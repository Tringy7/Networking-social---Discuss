package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Set;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECT c.slug FROM Category c")
    Set<String> findAllSlugs();
}

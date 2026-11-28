package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Category;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    boolean existsBySlugIgnoreCaseAndIdNot(String slug, Long id);

    @Query("SELECT c.slug FROM Category c")
    Set<String> findAllSlugs();
}

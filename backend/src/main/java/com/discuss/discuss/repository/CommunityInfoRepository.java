package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityInfo;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityInfoRepository extends JpaRepository<CommunityInfo,Long> {
    boolean existsByCategoryId(Long categoryId);

    @EntityGraph(attributePaths = "category")
    Optional<CommunityInfo> findByCommunity(Community community);
}

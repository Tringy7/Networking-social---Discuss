package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityInfo;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommunityInfoRepository extends JpaRepository<CommunityInfo,Long> {
    Optional<CommunityInfo> findByCommunityId(Long communityId);

    @EntityGraph(attributePaths = "category")
    Optional<CommunityInfo> findByCommunity(Community community);
}

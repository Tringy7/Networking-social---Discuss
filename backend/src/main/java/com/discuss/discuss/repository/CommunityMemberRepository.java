package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.MembershipStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CommunityMemberRepository extends JpaRepository<CommunityMember, Long> {

    long countByCommunityAndStatus(Community community, MembershipStatus status);

    Optional<CommunityMember> findByCommunityAndUser(Community community, User user);

    Optional<CommunityMember> findByCommunityAndUserAndStatus(
            Community community,
            User user,
            MembershipStatus status
    );

    // Used by transferOwnershipBeforeLeaving(): the earliest-joined member with the given role and status.
    Optional<CommunityMember> findFirstByCommunityAndRoleAndStatusOrderByJoinedAtAsc(
            Community community,
            CommunityRole role,
            MembershipStatus status
    );

    // Used by determineRoleForJoining(): checks whether the community has an ACTIVE Owner.
    boolean existsByCommunityAndRoleAndStatus(
            Community community,
            CommunityRole role,
            MembershipStatus status
    );

    Page<CommunityMember> findByUserAndStatus(
            User user,
            MembershipStatus status,
            Pageable pageable
    );

    // Owner first, then Moderators; each group is sorted by joinedAt ascending.
    // Uses an explicit CASE instead of "ORDER BY cm.role DESC" so the order does not
    // depend on the enum's @Enumerated mapping (ORDINAL vs STRING) or its alphabetical order.
    @Query("""
    SELECT cm
    FROM CommunityMember cm
    WHERE cm.community = :community
      AND cm.status = :status
      AND (:role IS NULL OR cm.role = :role)
    """)
    Page<CommunityMember> findCommunityMembers(
            @Param("community") Community community,
            @Param("status") MembershipStatus status,
            @Param("role") CommunityRole role,
            Pageable pageable
    );
}
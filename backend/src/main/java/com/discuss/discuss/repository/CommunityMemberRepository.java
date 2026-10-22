package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CommunityMemberRepository extends JpaRepository<CommunityMember, Long> {
    long countByCommunityAndStatus(Community community, MembershipStatus status);
    Optional<CommunityMember> findByCommunityAndUser(Community community, User user);

    @Query("""
        SELECT cm FROM CommunityMember cm
        JOIN FETCH cm.user
        WHERE cm.community = :community
          AND cm.role IN :roles
          AND cm.status = :status
        ORDER BY cm.role DESC, cm.joinedAt ASC
    """)
    List<CommunityMember> findStaffMembers(
            @Param("community") Community community,
            @Param("roles") Collection<CommunityRole> roles,
            @Param("status") MembershipStatus status
    );

    Optional<CommunityMember>
    findByCommunityAndUserAndStatus(
            Community community,
            User user,
            MembershipStatus status
    );
}

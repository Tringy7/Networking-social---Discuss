package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommunityMemberRepository extends JpaRepository<CommunityMember, Long> {
    long countByCommunityAndStatus(Community community, MembershipStatus status);
    Optional<CommunityMember> findByCommunityAndUser(Community community, User user);
}

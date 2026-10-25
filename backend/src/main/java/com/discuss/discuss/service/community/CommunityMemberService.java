
package com.discuss.discuss.service.community;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.MembershipStatus;
import com.discuss.discuss.exception.community.CommunityErrorCode;
import com.discuss.discuss.exception.community.CommunityException;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.repository.CommunityRepository;
import com.discuss.discuss.service.community.support.CommunityNameNormalizer;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommunityMemberService {

    private final CommunityMemberRepository memberRepository;
    private final CommunityRepository communityRepository;
    private final CommunityNameNormalizer nameNormalizer;
    private final UserService userService;

    @Transactional
    public CommunityMember addOwner(Community community, User user) {
        CommunityMember owner = CommunityMember.builder()
                .community(community)
                .user(user)
                .role(CommunityRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();

        return memberRepository.save(owner);
    }

    public long countActiveMembers(Community community) {
        return memberRepository.countByCommunityAndStatus(
                community,
                MembershipStatus.ACTIVE
        );
    }

    public Page<CommunityMember> getJoinedCommunities(
            Pageable pageable
    ) {
        User user = userService.getCurrentUser();

        return memberRepository.findByUserAndStatus(
                user,
                MembershipStatus.ACTIVE,
                pageable
        );
    }

    public List<CommunityMember> getStaffMembers(
            Community community
    ) {
        return memberRepository.findStaffMembers(
                community,
                List.of(
                        CommunityRole.OWNER,
                        CommunityRole.MODERATOR
                ),
                MembershipStatus.ACTIVE
        );
    }

    @Transactional
    public void joinCommunity(String communityName) {
        User user = userService.getCurrentUser();

        Community community =
                getCommunityByNameAndStatusActive(communityName);

        validateCanJoin(community);

        CommunityMember member = getExistingMembership(community, user);

        if (member == null) {
            createMembership(community, user);
            return;
        }

        if (member.getStatus() == MembershipStatus.ACTIVE) {
            throw new CommunityException(
                    CommunityErrorCode.ALREADY_MEMBER
            );
        }

        if (member.getStatus() == MembershipStatus.BANNED) {
            throw new CommunityException(
                    CommunityErrorCode.MEMBER_BANNED
            );
        }

        reactivateMembership(member);
    }

    private void validateCanJoin(Community community) {
        if (community.getVisibility() == CommunityVisibility.PRIVATE) {
            throw new CommunityException(
                    CommunityErrorCode.COMMUNITY_PRIVATE
            );
        }
    }

    private void createMembership(
            Community community,
            User user
    ) {
        CommunityMember member = CommunityMember.builder()
                .community(community)
                .user(user)
                .role(CommunityRole.MEMBER)
                .status(MembershipStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();

        memberRepository.save(member);
    }

    private void reactivateMembership(CommunityMember member) {
        member.setRole(CommunityRole.MEMBER);
        member.setStatus(MembershipStatus.ACTIVE);
        member.setJoinedAt(LocalDateTime.now());
        member.setLeftAt(null);

        memberRepository.save(member);
    }

    @Transactional
    public void leaveCommunity(String communityName) {
        User user = userService.getCurrentUser();

        Community community =
                getCommunityByNameAndStatusActive(communityName);

        CommunityMember member = getExistingMembership(
                community,
                user
        );

        validateActiveMembership(member);
        validateCanLeave(member);

        member.setStatus(MembershipStatus.LEFT);
        member.setLeftAt(LocalDateTime.now());

        memberRepository.save(member);
    }

    @Transactional
    public void kickMember(String communityName, Long userId) {
        User user = userService.getUserActive(userId);

        Community community =
                getCommunityByNameAndStatusActive(communityName);

        CommunityMember member = getExistingMembership(
                community,
                user
        );

        validateActiveMembership(member);
        validateCanLeave(member);

        member.setStatus(MembershipStatus.KICKED);
        member.setLeftAt(LocalDateTime.now());

        memberRepository.save(member);
    }

    private void validateActiveMembership(CommunityMember member) {
        if (member == null
                || member.getStatus() != MembershipStatus.ACTIVE) {
            throw new CommunityException(
                    CommunityErrorCode.NOT_A_MEMBER
            );
        }
    }

    private void validateCanLeave(CommunityMember member) {
        if (member.getRole() == CommunityRole.OWNER) {
            throw new CommunityException(
                    CommunityErrorCode.OWNER_CANNOT_LEAVE
            );
        }
    }

    // =========================
    // Shared helpers
    // =========================

    private CommunityMember getExistingMembership(
            Community community,
            User user
    ) {
        return memberRepository
                .findByCommunityAndUser(community, user)
                .orElse(null);
    }

    private Community getCommunityByNameAndStatusActive(
            String name
    ) {
        String normalizedName = nameNormalizer.normalize(name);

        Community community = communityRepository
                .findByName(normalizedName)
                .orElseThrow(() -> new CommunityException(
                        CommunityErrorCode.COMMUNITY_NOT_FOUND
                ));

        if (community.getStatus() != CommunityStatus.ACTIVE) {
            throw new CommunityException(
                    CommunityErrorCode.FORBIDDEN,
                    "This community is not active"
            );
        }

        return community;
    }
}

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

    // Creates the initial Owner membership when a community is created.
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

    // Appoints an ACTIVE member as Moderator; only the Owner can do this.
    @Transactional
    public void appointModerator(String communityName, String username) {
        User currentUser = userService.getCurrentUser();
        Community community = getCommunityByNameAndStatusActive(communityName);

        CommunityMember currentMembership =
                getExistingMembership(community, currentUser);
        validateActiveMembership(currentMembership);
        validateOwner(currentMembership, "Only the community owner can appoint moderators");

        User targetUser = userService.getUserActive(username);
        CommunityMember targetMembership =
                getExistingMembership(community, targetUser);
        validateActiveMembership(targetMembership);

        if (targetMembership.getRole() == CommunityRole.OWNER) {
            throw new CommunityException(
                    CommunityErrorCode.FORBIDDEN,
                    "Cannot change the owner's role"
            );
        }

        if (targetMembership.getRole() == CommunityRole.MODERATOR) {
            throw new CommunityException(
                    CommunityErrorCode.FORBIDDEN,
                    "User is already a moderator"
            );
        }

        targetMembership.setRole(CommunityRole.MODERATOR);
        memberRepository.save(targetMembership);
    }

    // Demotes a Moderator back to Member without changing the membership status.
    @Transactional
    public void removeModerator(String communityName, String username) {
        User currentUser = userService.getCurrentUser();
        Community community = getCommunityByNameAndStatusActive(communityName);

        CommunityMember currentMembership =
                getExistingMembership(community, currentUser);
        validateActiveMembership(currentMembership);
        validateOwner(currentMembership, "Only the community owner can remove moderators");

        User targetUser = userService.getUserActive(username);
        CommunityMember targetMembership =
                getExistingMembership(community, targetUser);
        validateActiveMembership(targetMembership);

        if (targetMembership.getRole() != CommunityRole.MODERATOR) {
            throw new CommunityException(
                    CommunityErrorCode.MODERATOR_NOT_FOUND,
                    "User is not a moderator of this community"
            );
        }

        targetMembership.setRole(CommunityRole.MEMBER);
        memberRepository.save(targetMembership);
    }

    // Counts the ACTIVE memberships in the community.
    public long countActiveMembers(Community community) {
        return memberRepository.countByCommunityAndStatus(
                community,
                MembershipStatus.ACTIVE
        );
    }

    // Gets a paginated list of communities the current user has joined.
    public Page<CommunityMember> getJoinedCommunities(Pageable pageable) {
        User user = userService.getCurrentUser();

        return memberRepository.findByUserAndStatus(
                user,
                MembershipStatus.ACTIVE,
                pageable
        );
    }

    // Gets the ACTIVE Owner and Moderators of the community.
    public List<CommunityMember> getStaffMembers(Community community) {
        return memberRepository.findStaffMembers(
                community,
                List.of(CommunityRole.OWNER, CommunityRole.MODERATOR),
                MembershipStatus.ACTIVE
        );
    }

    // Joins a community; if there is no ACTIVE Owner, the joining user becomes the Owner.
    @Transactional
    public void joinCommunity(String communityName) {
        User user = userService.getCurrentUser();
        Community community = getCommunityByNameAndStatusActive(communityName);

        validateCanJoin(community);

        CommunityMember member = getExistingMembership(community, user);

        if (member == null) {
            createMembership(community, user);
            return;
        }

        if (member.getStatus() == MembershipStatus.ACTIVE) {
            throw new CommunityException(CommunityErrorCode.ALREADY_MEMBER);
        }

        if (member.getStatus() == MembershipStatus.BANNED) {
            throw new CommunityException(CommunityErrorCode.MEMBER_BANNED);
        }

        // LEFT or KICKED members can rejoin; the role is determined again.
        reactivateMembership(member);
    }

    // Leaves a community; if the leaving user is the Owner, ownership is transferred first when a successor exists.
    @Transactional
    public void leaveCommunity(String communityName) {
        User user = userService.getCurrentUser();
        Community community = getCommunityByNameAndStatusActive(communityName);

        CommunityMember member = getExistingMembership(community, user);
        validateActiveMembership(member);

        if (member.getRole() == CommunityRole.OWNER) {
            transferOwnershipBeforeLeaving(community);
        }

        member.setStatus(MembershipStatus.LEFT);
        member.setLeftAt(LocalDateTime.now());
        memberRepository.save(member);
    }

    // Kicks a member out of the community; the Owner cannot be kicked.
    @Transactional
    public void kickMember(String communityName, String username) {
        User targetUser = userService.getUserActive(username);
        Community community = getCommunityByNameAndStatusActive(communityName);

        CommunityMember member = getExistingMembership(community, targetUser);
        validateActiveMembership(member);
        validateCanLeave(member);

        member.setStatus(MembershipStatus.KICKED);
        member.setLeftAt(LocalDateTime.now());
        memberRepository.save(member);
    }

    // Transfers ownership to another ACTIVE member; only the current Owner can do this.
    // The previous Owner becomes a regular Member.
    @Transactional
    public void transferOwnership(String communityName, String newOwnerUsername) {
        User currentUser = userService.getCurrentUser();
        Community community = getCommunityByNameAndStatusActive(communityName);

        CommunityMember currentMembership =
                getExistingMembership(community, currentUser);
        validateActiveMembership(currentMembership);
        validateOwner(currentMembership, "Only the community owner can transfer ownership");

        User targetUser = userService.getUserActive(newOwnerUsername);

        if (targetUser.getId().equals(currentUser.getId())) {
            throw new CommunityException(
                    CommunityErrorCode.FORBIDDEN,
                    "You are already the owner of this community"
            );
        }

        CommunityMember targetMembership =
                getExistingMembership(community, targetUser);
        validateActiveMembership(targetMembership);

        targetMembership.setRole(CommunityRole.OWNER);
        currentMembership.setRole(CommunityRole.MEMBER);

        memberRepository.save(targetMembership);
        memberRepository.save(currentMembership);
    }

    // Picks a Moderator first, then a Member; within each group, the earliest joinedAt is preferred.
    private void transferOwnershipBeforeLeaving(Community community) {
        CommunityMember successor = memberRepository
                .findFirstByCommunityAndRoleAndStatusOrderByJoinedAtAsc(
                        community,
                        CommunityRole.MODERATOR,
                        MembershipStatus.ACTIVE
                )
                .orElseGet(() -> memberRepository
                        .findFirstByCommunityAndRoleAndStatusOrderByJoinedAtAsc(
                                community,
                                CommunityRole.MEMBER,
                                MembershipStatus.ACTIVE
                        )
                        .orElse(null));

        // If no other members remain, the community temporarily has no Owner.
        if (successor == null) {
            return;
        }

        successor.setRole(CommunityRole.OWNER);
        memberRepository.save(successor);
    }

    // Checks whether the community allows direct joining.
    private void validateCanJoin(Community community) {
        if (community.getVisibility() == CommunityVisibility.PRIVATE) {
            throw new CommunityException(CommunityErrorCode.COMMUNITY_PRIVATE);
        }
    }

    // Creates a new membership with the Owner role if the community has no ACTIVE Owner.
    private void createMembership(Community community, User user) {
        CommunityMember member = CommunityMember.builder()
                .community(community)
                .user(user)
                .role(determineRoleForJoining(community))
                .status(MembershipStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();

        memberRepository.save(member);
    }

    // Reactivates a LEFT/KICKED membership and determines the role based on the current Owner.
    private void reactivateMembership(CommunityMember member) {
        member.setRole(determineRoleForJoining(member.getCommunity()));
        member.setStatus(MembershipStatus.ACTIVE);
        member.setJoinedAt(LocalDateTime.now());
        member.setLeftAt(null);

        memberRepository.save(member);
    }

    // The joining user becomes Owner if the community has no ACTIVE Owner; otherwise Member.
    private CommunityRole determineRoleForJoining(Community community) {
        boolean hasActiveOwner = memberRepository.existsByCommunityAndRoleAndStatus(
                community,
                CommunityRole.OWNER,
                MembershipStatus.ACTIVE
        );

        return hasActiveOwner ? CommunityRole.MEMBER : CommunityRole.OWNER;
    }

    // Rejects if the membership does not exist or is not ACTIVE.
    private void validateActiveMembership(CommunityMember member) {
        if (member == null || member.getStatus() != MembershipStatus.ACTIVE) {
            throw new CommunityException(CommunityErrorCode.NOT_A_MEMBER);
        }
    }

    // Rejects leave/kick operations if the member is the Owner; the Owner is handled separately when leaving on their own.
    private void validateCanLeave(CommunityMember member) {
        if (member.getRole() == CommunityRole.OWNER) {
            throw new CommunityException(CommunityErrorCode.OWNER_CANNOT_LEAVE);
        }
    }

    // Checks that the membership has the Owner role.
    private void validateOwner(CommunityMember member, String message) {
        if (member.getRole() != CommunityRole.OWNER) {
            throw new CommunityException(CommunityErrorCode.FORBIDDEN, message);
        }
    }

    // Finds a user's membership in a community; returns null if no record exists.
    private CommunityMember getExistingMembership(Community community, User user) {
        return memberRepository.findByCommunityAndUser(community, user).orElse(null);
    }

    // Finds a community by its normalized name and requires it to be ACTIVE.
    private Community getCommunityByNameAndStatusActive(String name) {
        String normalizedName = nameNormalizer.normalize(name);

        Community community = communityRepository.findByName(normalizedName)
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
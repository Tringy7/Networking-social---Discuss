package com.discuss.discuss.service.community;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.community.CommunityJoinRequestDTO;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityJoinRequest;
import com.discuss.discuss.entity.CommunityJoinRequest.Status;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.MembershipStatus;
import com.discuss.discuss.enums.NotificationEventType;
import com.discuss.discuss.exception.community.CommunityErrorCode;
import com.discuss.discuss.exception.community.CommunityException;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.repository.CommunityJoinRequestRepository;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.repository.CommunityRepository;
import com.discuss.discuss.service.notification.NotificationEvents;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CommunityMemberService {

    private final CommunityMemberRepository memberRepository;
    private final CommunitySupport communitySupport;
    private final UserService userService;

    private final CommunityRepository communityRepository;
    private final CommunityJoinRequestRepository joinRequestRepository;
    private final CommunityAuthorizationService authorization;
    private final PageMapper pageMapper;
    private final NotificationEvents notificationEvents;

    public record JoinResult(CommunityRole role, boolean pending) {}

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
        Community community = communitySupport.getActiveCommunityForMembership(communityName);

        CommunityMember currentMembership =
                getExistingMembership(community, currentUser);
        validateActiveMembership(currentMembership);
        validateOwner(currentMembership, "Only the community owner can appoint moderators");

        User targetUser = userService.getActiveByUsername(username);
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
        Community community = communitySupport.getActiveCommunityForMembership(communityName);

        CommunityMember currentMembership =
                getExistingMembership(community, currentUser);
        validateActiveMembership(currentMembership);
        validateOwner(currentMembership, "Only the community owner can remove moderators");

        User targetUser = userService.getActiveByUsername(username);
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
    // Gets paginated active members of a community, optionally filtered by role.
    public Page<CommunityMember> getCommunityMembers(
            Community community,
            CommunityRole role,
            Pageable pageable
    ) {
        return memberRepository.findCommunityMembers(
                community,
                MembershipStatus.ACTIVE,
                role,
                pageable
        );
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public JoinResult joinCommunity(String communityName) {
        Community community = communitySupport.getActiveCommunityForMembership(communityName);
        User user = userService.getCurrentUser();
        CommunityMember member = getExistingMembership(community, user);
        validateJoinMembership(member);

        var pending = joinRequestRepository.findByCommunityAndApplicantAndStatus(community, user, Status.PENDING);
        if (community.getVisibility() == CommunityVisibility.PRIVATE) {
            if (pending.isEmpty()) {
                joinRequestRepository.save(new CommunityJoinRequest(community, user));
                notificationEvents.enqueueCommunityMembershipNotification(
                        NotificationEventType.COMMUNITY_JOIN_REQUESTED, user.getId(), community.getId());
            }
            return new JoinResult(null, true);
        }

        pending.ifPresent(CommunityJoinRequest::close);
        CommunityRole role = activateMembership(community, user, member).getRole();
        notificationEvents.enqueueCommunityMembershipNotification(
                NotificationEventType.COMMUNITY_JOINED, user.getId(), community.getId());
        return new JoinResult(role, false);
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<CommunityJoinRequestDTO> listJoinRequests(
            String name, boolean history, Pageable pageable
    ) {
        Community community = communitySupport.getCommunityByNameAndStatusActive(name);
        authorization.requireModeratorOrOwner(community, userService.getCurrentUser());
        requirePrivateJoinRequests(community);
        var requests = history
                ? joinRequestRepository.findByCommunityAndStatusNot(community, Status.PENDING, pageable)
                : joinRequestRepository.findByCommunityAndStatus(community, Status.PENDING, pageable);
        return pageMapper.toResponse(requests.map(CommunityJoinRequestDTO::from));
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public CommunityJoinRequestDTO reviewJoinRequest(String name, Long id, boolean approve) {
        Community community = communitySupport.getActiveCommunityForMembership(name);
        User reviewer = userService.getCurrentUser();
        authorization.requireModeratorOrOwner(community, reviewer);
        requirePrivateJoinRequests(community);

        CommunityJoinRequest request = joinRequestRepository.findByIdAndCommunity(id, community)
                .orElseThrow(() -> new CommunityException(CommunityErrorCode.JOIN_REQUEST_NOT_FOUND));
        if (request.getStatus() != Status.PENDING) {
            throw new CommunityException(CommunityErrorCode.JOIN_REQUEST_ALREADY_REVIEWED);
        }

        if (approve) {
            User applicant = request.getApplicant();
            if (applicant.getStatus() != UserStatus.ACTIVE) {
                throw new CommunityException(CommunityErrorCode.FORBIDDEN, "Applicant account is not active");
            }
            CommunityMember member = getExistingMembership(community, applicant);
            validateJoinMembership(member);
            activateMembership(community, applicant, member);
        }

        request.review(reviewer, approve);
        notificationEvents.enqueueCommunityMembershipNotification(
                approve ? NotificationEventType.COMMUNITY_JOIN_APPROVED : NotificationEventType.COMMUNITY_JOIN_REJECTED,
                request.getApplicant().getId(), community.getId());
        return CommunityJoinRequestDTO.from(request);
    }

    private void requirePrivateJoinRequests(Community community) {
        if (community.getVisibility() != CommunityVisibility.PRIVATE) {
            throw new CommunityException(CommunityErrorCode.JOIN_REQUESTS_PRIVATE_ONLY);
        }
    }

    public CommunityRole getActiveRole(Community community, User user) {
        return memberRepository.findByCommunityAndUserAndStatus(community, user, MembershipStatus.ACTIVE)
                .map(CommunityMember::getRole)
                .orElse(null);
    }

    public boolean hasPendingJoinRequest(Community community, User user) {
        return joinRequestRepository.findByCommunityAndApplicantAndStatus(community, user, Status.PENDING).isPresent();
    }

    private CommunityMember activateMembership(Community community, User user, CommunityMember member) {
        if (member == null) {
            return createMembership(community, user);
        }
        reactivateMembership(member);
        return member;
    }

    private void validateJoinMembership(CommunityMember member) {
        if (member == null) {
            return;
        }
        if (member.getStatus() == MembershipStatus.ACTIVE) {
            throw new CommunityException(CommunityErrorCode.ALREADY_MEMBER);
        }
        if (member.getStatus() == MembershipStatus.BANNED) {
            throw new CommunityException(CommunityErrorCode.MEMBER_BANNED);
        }
    }

    // Leaves a community; if the leaving user is the Owner, ownership is transferred first when a successor exists.
    @Transactional
    public void leaveCommunity(String communityName) {
        User user = userService.getCurrentUser();
        Community community = communitySupport.getActiveCommunityForMembership(communityName);

        CommunityMember member = getExistingMembership(community, user);
        validateActiveMembership(member);

        if (member.getRole() == CommunityRole.OWNER) {
            transferOwnershipBeforeLeaving(community);
            member.setRole(CommunityRole.MEMBER);
        }

        member.setStatus(MembershipStatus.LEFT);
        member.setLeftAt(LocalDateTime.now());
        memberRepository.save(member);
    }

    // Kicks a member out of the community; the Owner cannot be kicked.
    @Transactional
    public void kickMember(String communityName, String username) {
        Community community = communitySupport.getActiveCommunityForMembership(communityName);
        authorization.requireModeratorOrOwner(community, userService.getCurrentUser());
        User targetUser = userService.getActiveByUsername(username);

        CommunityMember member = getExistingMembership(community, targetUser);
        validateActiveMembership(member);
        validateCanLeave(member);

        member.setStatus(MembershipStatus.KICKED);
        member.setLeftAt(LocalDateTime.now());
        memberRepository.save(member);
    }

    // Transfers ownership to another ACTIVE member; only the current Owner can do this.
    // The previous Owner remains ACTIVE and becomes a Moderator.
    @Transactional
    public void transferOwnership(String communityName, String newOwnerUsername) {
        User currentUser = userService.getCurrentUser();
        Community community = communitySupport.getActiveCommunityForMembership(communityName);

        CommunityMember currentMembership =
                getExistingMembership(community, currentUser);
        validateActiveMembership(currentMembership);
        validateOwner(currentMembership, "Only the community owner can transfer ownership");

        User targetUser = userService.getActiveByUsername(newOwnerUsername);

        if (targetUser.getId().equals(currentUser.getId())) {
            throw new CommunityException(
                    CommunityErrorCode.FORBIDDEN,
                    "You are already the owner of this community"
            );
        }

        CommunityMember targetMembership =
                getExistingMembership(community, targetUser);
        validateActiveMembership(targetMembership);

        community.setOwner(targetUser);
        communityRepository.save(community);
        targetMembership.setRole(CommunityRole.OWNER);
        currentMembership.setRole(CommunityRole.MODERATOR);

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

        if (successor == null && community.getVisibility() == CommunityVisibility.PRIVATE) {
            throw new CommunityException(CommunityErrorCode.OWNER_CANNOT_LEAVE);
        }

        // If no other members remain, the community temporarily has no Owner.
        community.setOwner(successor == null ? null : successor.getUser());
        communityRepository.save(community);
        if (successor == null) {
            return;
        }

        successor.setRole(CommunityRole.OWNER);
        memberRepository.save(successor);
    }

    // Creates a new membership with the Owner role if the community has no ACTIVE Owner.
    private CommunityMember createMembership(Community community, User user) {
        CommunityMember member = CommunityMember.builder()
                .community(community)
                .user(user)
                .role(determineRoleForJoining(community, user))
                .status(MembershipStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();

        return memberRepository.save(member);
    }

    // Reactivates a LEFT/KICKED membership and determines the role based on the current Owner.
    private void reactivateMembership(CommunityMember member) {
        member.setRole(determineRoleForJoining(member.getCommunity(), member.getUser()));
        member.setStatus(MembershipStatus.ACTIVE);
        member.setJoinedAt(LocalDateTime.now());
        member.setLeftAt(null);

        memberRepository.save(member);
    }

    // The joining user becomes Owner if the community has no ACTIVE Owner; otherwise Member.
    private CommunityRole determineRoleForJoining(Community community, User user) {
        boolean hasActiveOwner = memberRepository.existsByCommunityAndRoleAndStatus(
                community,
                CommunityRole.OWNER,
                MembershipStatus.ACTIVE
        );

        if (!hasActiveOwner) {
            community.setOwner(user);
            communityRepository.save(community);
        }
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
}

package com.discuss.discuss.service.community;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.MembershipStatus;
import com.discuss.discuss.repository.CommunityMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CommunityAuthorizationService {

    private final CommunityMemberRepository memberRepository;

    public CommunityMember requireMembership(
            Community community,
            User user
    ) {
        return memberRepository
                .findByCommunityAndUserAndStatus(
                        community,
                        user,
                        MembershipStatus.ACTIVE
                )
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "You are not an active member"
                        )
                );
    }

    /** Public communities allow signed-in nonmembers to comment; bans still apply. */
    public void requireCommentPermission(Community community, User user) {
        if (user == null || community.getStatus() != CommunityStatus.ACTIVE) {
            throw new AccessDeniedException("Commenting is not allowed");
        }
        CommunityMember member = memberRepository.findByCommunityAndUser(community, user).orElse(null);
        if (member != null && member.getStatus() == MembershipStatus.BANNED) {
            throw new AccessDeniedException("You are banned from this community");
        }
        if (community.getVisibility() != CommunityVisibility.PUBLIC
                && (member == null || member.getStatus() != MembershipStatus.ACTIVE)) {
            throw new AccessDeniedException("You are not an active member");
        }
    }

    public void requireModeratorOrOwner(
            Community community,
            User user
    ) {
        CommunityMember member =
                requireMembership(community, user);

        CommunityRole role = member.getRole();

        if (role != CommunityRole.MODERATOR
                && role != CommunityRole.OWNER) {
            throw new AccessDeniedException(
                    "Moderator or Owner permission required"
            );
        }
    }

    public void requireOwner(
            Community community,
            User user
    ) {
        CommunityMember member =
                requireMembership(community, user);

        if (member.getRole() != CommunityRole.OWNER) {
            throw new AccessDeniedException(
                    "Owner permission required"
            );
        }
    }
}

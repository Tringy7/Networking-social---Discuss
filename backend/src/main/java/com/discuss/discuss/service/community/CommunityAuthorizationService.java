package com.discuss.discuss.service.community;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.MembershipStatus;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.repository.CommunityRepository;
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

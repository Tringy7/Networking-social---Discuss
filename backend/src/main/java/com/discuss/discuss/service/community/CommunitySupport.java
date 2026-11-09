package com.discuss.discuss.service.community;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.MembershipStatus;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.exception.community.CommunityErrorCode;
import com.discuss.discuss.exception.community.CommunityException;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.repository.CommunityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class CommunitySupport {
    private static final Set<String> RESERVED_NAMES = Set.of(
            "me", "explore", "new", "create", "search", "admin", "popular"
    );

    private final CommunityRepository communityRepository;
    private final CommunityMemberRepository communityMemberRepository;

    public String normalize(String name) {
        if (name == null) {
            return null;
        }
        return name.trim().toLowerCase(Locale.ROOT);
    }

    public Community getCommunityById(Long id) {
        return communityRepository.findById(id)
                .orElseThrow(() -> new CommunityException(CommunityErrorCode.COMMUNITY_NOT_FOUND));
    }

    public Community getCommunityByName(String name) {
        String normalizedName = normalize(name);
        return communityRepository.findByName(normalizedName)
                .orElseThrow(() -> new CommunityException(CommunityErrorCode.COMMUNITY_NOT_FOUND));
    }

    public Community getCommunityByNameAndStatusActive(String name) {
        Community community = getCommunityByName(name);
        if (community.getStatus() != CommunityStatus.ACTIVE) {
            throw new CommunityException(CommunityErrorCode.COMMUNITY_NOT_FOUND);
        }
        return community;
    }

    // Membership operations retain their existing 403 response for inactive communities.
    public Community getActiveCommunityForMembership(String name) {
        Community community = getCommunityByName(name);
        if (community.getStatus() != CommunityStatus.ACTIVE) {
            throw new CommunityException(CommunityErrorCode.FORBIDDEN, "This community is not active");
        }
        return community;
    }

    public boolean checkExistsCommunityByName(String name) {
        return communityRepository.existsByName(name);
    }

    public void checkNameCommunityReserved(String name) {
        if (RESERVED_NAMES.contains(name)) {
            throw new CommunityException(CommunityErrorCode.COMMUNITY_NAME_RESERVED);
        }
    }

    public void checkCommunity(Community community, User reporter) {
        if (community.getStatus() != CommunityStatus.ACTIVE) {
            throw new CommunityException(CommunityErrorCode.COMMUNITY_NOT_FOUND);
        }

        if (community.getVisibility() != CommunityVisibility.PRIVATE) {
            return;
        }

        if (reporter.getRole() == UserRole.ADMIN) {
            return;
        }

        boolean isOwner = community.getOwner() != null
                && community.getOwner().getId().equals(reporter.getId());

        if (isOwner) {
            return;
        }

        boolean isActiveMember = communityMemberRepository.findByCommunityAndUserAndStatus(
                community,
                reporter,
                MembershipStatus.ACTIVE
        ).isPresent();

        if (!isActiveMember) {
            throw new CommunityException(CommunityErrorCode.COMMUNITY_NOT_FOUND);
        }
    }
}

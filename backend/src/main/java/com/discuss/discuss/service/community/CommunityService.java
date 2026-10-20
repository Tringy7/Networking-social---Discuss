
package com.discuss.discuss.service.community;

import com.discuss.discuss.dto.community.CommunityDetailResponseDTO;
import com.discuss.discuss.dto.community.CreateCommunityRequestDTO;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityInfo;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.exception.community.CommunityErrorCode;
import com.discuss.discuss.exception.community.CommunityException;
import com.discuss.discuss.mapper.community.CommunityMapper;
import com.discuss.discuss.repository.CommunityRepository;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private static final Set<String> RESERVED_NAMES = Set.of(
            "me", "explore", "new", "create",
            "search", "admin", "popular"
    );

    private final CommunityRepository communityRepository;
    private final CommunityInfoService communityInfoService;
    private final CommunityMemberService communityMemberService;
    private final UserService userService;
    private final CommunityMapper communityMapper;

    @Transactional
    public CommunityDetailResponseDTO createCommunity(
            CreateCommunityRequestDTO req
    ) {
        User user = userService.getCurrentUser();

        String name = req.getName().trim().toLowerCase(Locale.ROOT);

        if (RESERVED_NAMES.contains(name)) {
            throw new CommunityException(
                    CommunityErrorCode.COMMUNITY_NAME_RESERVED
            );
        }

        if (communityRepository.existsByName(name)) {
            throw new CommunityException(
                    CommunityErrorCode.COMMUNITY_NAME_TAKEN
            );
        }

        Community community;

        try {
            community = communityRepository.saveAndFlush(
                    Community.builder()
                            .owner(user)
                            .name(name)
                            .build()
            );
        } catch (DataIntegrityViolationException e) {
            throw new CommunityException(
                    CommunityErrorCode.COMMUNITY_NAME_TAKEN
            );
        }

        CommunityInfo info =
                communityInfoService.createCommunityInfo(community, req);

        CommunityMember owner =
                communityMemberService.addOwner(community, user);

        return communityMapper.toDetail(community, info, 1L, List.of(owner));
    }

    public CommunityDetailResponseDTO getCommunity(String name) {
        String normalizedName = name.trim().toLowerCase(Locale.ROOT);

        Community community = communityRepository
                .findByName(normalizedName)
                .orElseThrow(() -> new CommunityException(
                        CommunityErrorCode.COMMUNITY_NOT_FOUND
                ));

        CommunityInfo info =
                communityInfoService.getActiveInfo(community);

        long memberCount =
                communityMemberService.countActiveMembers(community);

        List<CommunityMember> staffMembers =
                communityMemberService.getStaffMembers(community);

        return communityMapper.toDetail(community, info, memberCount, staffMembers);
    }
}

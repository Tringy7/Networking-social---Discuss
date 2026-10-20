
package com.discuss.discuss.service.community;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.community.CommunityDetailResponseDTO;
import com.discuss.discuss.dto.community.CommunityPreviewResponseDTO;
import com.discuss.discuss.dto.community.CreateCommunityRequestDTO;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityInfo;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.exception.community.CommunityErrorCode;
import com.discuss.discuss.exception.community.CommunityException;
import com.discuss.discuss.mapper.community.CommunityMapper;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.repository.CommunityRepository;
import com.discuss.discuss.service.user.UserService;
import jakarta.persistence.criteria.Join;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
    private final PageMapper pageMapper;

    @Transactional
    public CommunityDetailResponseDTO createCommunity(CreateCommunityRequestDTO req) {
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

    public PageResponseDTO<CommunityPreviewResponseDTO> getAllCommunityWithFilter(
            Specification<Community> filter,
            Pageable pageable) {

        Specification<Community> specification =
                buildPublicCommunitySpecification();

        if (filter != null) {
            specification = specification.and(filter);
        }

        return this.pageMapper.toResponse(
                communityRepository
                        .findAll(specification, pageable)
                        .map(community -> communityMapper.toPreview(
                                community,
                                community.getInfo(),
                                communityMemberService.countActiveMembers(community)
                        ))
        );
    }

    private Specification<Community> buildPublicCommunitySpecification() {
        return (root, query, cb) -> {
            Join<Community, CommunityInfo> info =
                    root.join("info");

            return cb.and(
                    cb.equal(info.get("status"), CommunityStatus.ACTIVE),
                    cb.equal(info.get("visibility"), CommunityVisibility.PUBLIC)
            );
        };
    }
}

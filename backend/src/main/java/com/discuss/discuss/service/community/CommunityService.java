
package com.discuss.discuss.service.community;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.community.CommunityDetailResponseDTO;
import com.discuss.discuss.dto.community.CommunityPreviewResponseDTO;
import com.discuss.discuss.dto.community.CreateCommunityRequestDTO;
import com.discuss.discuss.dto.community.UpdateCommunityRequestDTO;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.exception.community.CommunityErrorCode;
import com.discuss.discuss.exception.community.CommunityException;
import com.discuss.discuss.mapper.community.CommunityMapper;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.repository.CommunityRepository;
import com.discuss.discuss.service.community.spectification.CommunitySpecifications;
import com.discuss.discuss.service.community.support.CommunityNameNormalizer;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
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
    private final CommunityAuthorizationService communityAuthorizationService;

    private final CommunityMapper communityMapper;
    private final PageMapper pageMapper;
    private final CommunitySpecifications communitySpecifications;
    private final CommunityNameNormalizer nameNormalizer;

    /*
    * Create new community
    * */
    @Transactional
    public CommunityDetailResponseDTO createCommunity(CreateCommunityRequestDTO req) {
        User user = userService.getCurrentUser();

        String name = this.nameNormalizer.normalize(req.getName());

        this.checkNameCommunityReserved(name);
        if (this.checkExistsCommunityByName(name)) {
            throw new CommunityException(
                    CommunityErrorCode.COMMUNITY_NAME_TAKEN
            );
        };

        Community community;
        try {
            community = communityRepository.saveAndFlush(
                    Community.builder()
                            .owner(user)
                            .name(name)
                            .status(CommunityStatus.ACTIVE)
                            .visibility(
                                    req.getVisibility() == null
                                            ? CommunityVisibility.PUBLIC
                                            : req.getVisibility())
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

    /*
    * Update information community
    * */
    @Transactional
    public CommunityDetailResponseDTO updateCommunity(
            String communityName,
            UpdateCommunityRequestDTO request
    ) {
        User user = userService.getCurrentUser();
        Community community = this.getCommunityByNameAndStatusActive(communityName);

        // Check role user into community
        communityAuthorizationService.requireOwner(community, user);

        String name = this.nameNormalizer.normalize(request.getName());
        this.checkNameCommunityReserved(name);
        community.setName(name);

        CommunityInfo info =
                communityInfoService.updateInfo(community, request);

        long memberCount =
                communityMemberService.countActiveMembers(community);

        List<CommunityMember> staffMembers =
                communityMemberService.getStaffMembers(community);

        return communityMapper.toDetail(
                community,
                info,
                memberCount,
                staffMembers
        );
    }


    /*
    * Delete community with the name
    * */
    @Transactional
    public void deleteCommunity(String communityName) {
        User user = userService.getCurrentUser();

        Community community = this.getCommunityByNameAndStatusActive(communityName);

        communityAuthorizationService.requireOwner(community, user);
        community.setStatus(CommunityStatus.DELETED);
        communityRepository.save(community);
    }

    /*
    * Get information detail community
    * */
    public CommunityDetailResponseDTO getCommunityDetail(String name) {
        Community community = this.getCommunityByNameAndStatusActive(name);

        CommunityInfo info = community.getInfo();

        long memberCount =
                communityMemberService.countActiveMembers(community);

        List<CommunityMember> staffMembers =
                communityMemberService.getStaffMembers(community);

        return communityMapper.toDetail(community, info, memberCount, staffMembers);
    }

    /*
    * Get all communities with spectification and paging
    * */
    public PageResponseDTO<CommunityPreviewResponseDTO> getAllCommunitiesWithSpec(
            Specification<Community> filter,
            Pageable pageable) {

        Specification<Community> specification =
                communitySpecifications.buildPublicCommunitySpecification();

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

    /*
     * Get all communities with paging
     * */
    public PageResponseDTO<CommunityPreviewResponseDTO>
    getAllCommunities(Pageable pageable) {
        Page<CommunityPreviewResponseDTO> communities =
                communityRepository
                        .findAll(pageable)
                        .map(community -> communityMapper.toPreview(
                                community,
                                community.getInfo(),
                                communityMemberService.countActiveMembers(community)
                        ));

        return pageMapper.toResponse(communities);
    }

    /*
    * Get all communities with name category
    * */
    public PageResponseDTO<CommunityPreviewResponseDTO>
    getCommunitiesByCategorySlug(String slug, Pageable pageable) {

        Page<CommunityPreviewResponseDTO> communities =
                communityRepository
                        .findAllByCategorySlug(slug, CommunityStatus.ACTIVE, pageable)
                        .map(community -> communityMapper.toPreview(
                                community,
                                community.getInfo(),
                                communityMemberService.countActiveMembers(community)
                        ));

        return pageMapper.toResponse(communities);
    }

    /*
    * Get all communities of user
    * */
    public PageResponseDTO<CommunityPreviewResponseDTO> getAllCommunitiesOfUser(
            Pageable pageable
    ) {
        User user = userService.getCurrentUser();

        Page<CommunityPreviewResponseDTO> communities =
                communityRepository.findByOwner(user, pageable)
                        .map(community -> communityMapper.toPreview(
                                community,
                                community.getInfo(),
                                communityMemberService.countActiveMembers(community)
                        ));

        return pageMapper.toResponse(communities);
    }


    /*
     * Get community by name with status active
     * */
    public Community getCommunityByNameAndStatusActive(String name) {
        String normalizedName = nameNormalizer.normalize(name);

        Community community = communityRepository.findByName(normalizedName)
                .orElseThrow(() ->
                        new CommunityException(
                                CommunityErrorCode.COMMUNITY_NOT_FOUND
                        )
                );

        if (community.getStatus().equals(CommunityStatus.ACTIVE)) {
            throw new CommunityException(
                    CommunityErrorCode.COMMUNITY_NOT_FOUND
            );
        }

        return community;
    }

    /*
     * Check exists community with name
     * => Exists -> true
     * */
    public boolean checkExistsCommunityByName(String name) {
        if (communityRepository.existsByName(name)) {
            return true;
        }
        return false;
    }

    /*
     * Check name communtiy reserved
     * */
    public void checkNameCommunityReserved(String name) {
        if (RESERVED_NAMES.contains(name)) {
            throw new CommunityException(
                    CommunityErrorCode.COMMUNITY_NAME_RESERVED
            );
        }
    }

}

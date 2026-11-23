
package com.discuss.discuss.service.community;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.community.*;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.exception.community.CommunityErrorCode;
import com.discuss.discuss.exception.community.CommunityException;
import com.discuss.discuss.mapper.community.CommunityMapper;
import com.discuss.discuss.mapper.community.CommunityMemberMapper;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.repository.CommunityRepository;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityRepository communityRepository;
    private final CommunitySupport communitySupport;

    private final CommunityInfoService communityInfoService;
    private final CommunityMemberService communityMemberService;
    private final UserService userService;
    private final CommunityAuthorizationService communityAuthorizationService;

    private final CommunityMapper communityMapper;
    private final PageMapper pageMapper;
    private final CommunitySpecifications communitySpecifications;
    private final CommunityMemberMapper communityMemberMapper;

    /*
    * Create new community
    * */
    @Transactional
    public CommunityDetailResponseDTO createCommunity(CreateCommunityRequestDTO req) {
        User user = userService.getCurrentUser();

        String name = communitySupport.normalize(req.getName());

        communitySupport.checkNameCommunityReserved(name);
        if (communitySupport.checkExistsCommunityByName(name)) {
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

        communityMemberService.addOwner(community, user);

        return communityMapper.toDetail(
                community,
                info,
                1L
        );
    }

    /*
    * Update information community
    * */
    @Transactional
    public CommunityDetailResponseDTO updateCommunity(
            String communityName,
            UpdateCommunityRequestDTO request
    ) {
        Community community = communitySupport.getActiveCommunityForMembership(communityName);
        User user = userService.getCurrentUser();

        // Check role user into community
        communityAuthorizationService.requireOwner(community, user);

        CommunityInfo info =
                communityInfoService.updateInfo(community, request);

        long memberCount =
                communityMemberService.countActiveMembers(community);

        return communityMapper.toDetail(
                community,
                info,
                memberCount
        );
    }

    /*
     * Get paginated community members, optionally filtered by role.
     */
    public PageResponseDTO<CommunityMemberResponseDTO> getCommunityMembers(
            Pageable pageable,
            String name,
            CommunityRole role
    ) {
        Community community = communitySupport.getCommunityByNameAndStatusActive(name);

        if (community.getVisibility() == CommunityVisibility.PRIVATE) {
            communityAuthorizationService.requireMembership(community, userService.getCurrentUser());
        }

        Page<CommunityMemberResponseDTO> members =
                communityMemberService
                        .getCommunityMembers(community, role, pageable)
                        .map(communityMemberMapper::toMemberDTO);

        return pageMapper.toResponse(members);
    }

    /*
    * Get information detail community
    * */
    @Transactional(readOnly = true)
    public CommunityDetailResponseDTO getCommunityDetail(String name) {
        Community community = communitySupport.getCommunityByNameAndStatusActive(name);

        User viewer = userService.getCurrentUser();
        CommunityDetailResponseDTO detail = toDetail(community);
        CommunityRole role = communityMemberService.getActiveRole(community, viewer);
        detail.setCurrentUserRole(role);
        detail.setJoinRequestPending(role == null && community.getVisibility() == CommunityVisibility.PRIVATE
                && communityMemberService.hasPendingJoinRequest(community, viewer));
        return detail;
    }

    /*
    * Get all communities with spectification and paging
    * */
    public PageResponseDTO<CommunityPreviewResponseDTO> getAllCommunitiesWithSpec(
            Specification<Community> filter,
            Pageable pageable) {

        Specification<Community> specification =
                communitySpecifications.hasStatus(CommunityStatus.ACTIVE);

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
                        .findAllByStatus(CommunityStatus.ACTIVE, pageable)
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
    public PageResponseDTO<CommunityPreviewResponseDTO> getAllCommunitiesOfOwner(
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
     * Get all communities of user join
     * */
    public PageResponseDTO<CommunityPreviewResponseDTO> getAllCommunitiesOfJoin(
            Pageable pageable
    ) {
        Page<CommunityPreviewResponseDTO> communities =
                communityMemberService.getJoinedCommunities(pageable)
                        .map(member -> {
                            Community community = member.getCommunity();

                            CommunityPreviewResponseDTO preview = communityMapper.toPreview(
                                    community,
                                    community.getInfo(),
                                    communityMemberService.countActiveMembers(community)
                            );
                            preview.setCurrentUserRole(member.getRole());
                            return preview;
                        });

        return pageMapper.toResponse(communities);
    }


    /** Internal management query; includes inactive and private communities when filters are omitted. */
    @HasRole("ADMIN")
    @Transactional(readOnly = true)
    public PageResponseDTO<CommunityDetailResponseDTO> getCommunities(
            Pageable pageable, CommunityStatus status, CommunityVisibility visibility) {
        Specification<Community> specification = communitySpecifications.hasStatus(status)
                .and(communitySpecifications.hasVisibility(visibility));
        return findCommunityDetails(specification, pageable);
    }

    @HasRole("ADMIN")
    @Transactional(readOnly = true)
    public PageResponseDTO<CommunityDetailResponseDTO> searchCommunities(
            Pageable pageable, String search, CommunityStatus status, CommunityVisibility visibility) {
        Specification<Community> specification = communitySpecifications.hasStatus(status)
                .and(communitySpecifications.hasVisibility(visibility))
                .and(communitySpecifications.matchesName(search));
        return findCommunityDetails(specification, pageable);
    }

    /** Internal detail lookup that also supports inactive communities. */
    @HasRole("ADMIN")
    @Transactional(readOnly = true)
    public CommunityDetailResponseDTO getCommunityDetailById(Long communityId) {
        return toDetail(communitySupport.getCommunityById(communityId));
    }

    @HasRole("ADMIN")
    @Transactional
    public boolean updateStatus(Long communityId, CommunityStatus status) {
        if (status == null) {
            throw new CommunityException(CommunityErrorCode.INVALID_STATUS);
        }

        Community community = communitySupport.getCommunityById(communityId);
        if (community.getStatus() == status) {
            return false;
        }

        community.setStatus(status);
        return true;
    }

    private PageResponseDTO<CommunityDetailResponseDTO> findCommunityDetails(
            Specification<Community> specification, Pageable pageable) {
        return pageMapper.toResponse(communityRepository.findAll(specification, pageable)
                .map(this::toDetail));
    }

    private CommunityDetailResponseDTO toDetail(Community community) {
        return communityMapper.toDetail(community, community.getInfo(),
                communityMemberService.countActiveMembers(community));
    }

    @Transactional(readOnly = true)
    @HasRole("ADMIN")
    public long countAll() {
        return communityRepository.count();
    }

    @Transactional(readOnly = true)
    @HasRole("ADMIN")
    public long countByStatus(CommunityStatus status) {
        return communityRepository.countByStatus(status);
    }
}

package com.discuss.discuss.mapper.community;

import com.discuss.discuss.dto.community.CommunityDetailResponseDTO;
import com.discuss.discuss.dto.community.CommunityMemberResponseDTO;
import com.discuss.discuss.dto.community.CommunityOwnerResponseDTO;
import com.discuss.discuss.dto.community.CommunityPreviewResponseDTO;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityInfo;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.repository.UserProfileRepository;
import com.discuss.discuss.service.community.CommunityInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CommunityMapper {

    private final CommunityInfoService communityInfoService;
    private final UserProfileRepository userProfileRepository;

    /**
     * Maps community details and owner information to a response DTO.
     */
    public CommunityDetailResponseDTO toDetail(
            Community community,
            CommunityInfo info,
            long memberCount
    ) {
        return CommunityDetailResponseDTO.builder()
                .id(community.getId())
                .name(community.getName())
                .description(info.getDescription())
                .avatarUrl(
                        communityInfoService.buildImageUrl(info.getAvatar())
                )
                .bannerUrl(
                        communityInfoService.buildImageUrl(info.getBanner())
                )
                .categoryId(
                        info.getCategory() != null
                                ? info.getCategory().getId()
                                : null
                )
                .categoryName(
                        info.getCategory() != null
                                ? info.getCategory().getName()
                                : null
                )
                .visibility(community.getVisibility())
                .status(community.getStatus())
                .memberCount(memberCount)
                .createdAt(community.getCreatedAt())
                .owner(toOwnerDTO(community.getOwner()))
                .build();
    }

    /**
     * Maps the community owner to a response DTO.
     */
    public CommunityOwnerResponseDTO toOwnerDTO(User user) {
        UserProfile profile = userProfileRepository
                .findByUser(user)
                .orElse(null);

        String displayName =
                profile != null
                        && profile.getDisplayName() != null
                        && !profile.getDisplayName().isBlank()
                        ? profile.getDisplayName()
                        : user.getUsername();

        String avatarUrl = profile != null
                ? communityInfoService.buildImageUrl(profile.getAvatar())
                : null;

        return CommunityOwnerResponseDTO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(displayName)
                .avatarUrl(avatarUrl)
                .build();
    }

    /**
     * Maps a community member to a response DTO.
     * Can be reused for member and moderator listing APIs.
     */
    public CommunityMemberResponseDTO toMemberDTO(CommunityMember member) {
        User user = member.getUser();

        UserProfile profile = userProfileRepository
                .findByUser(user)
                .orElse(null);

        String displayName =
                profile != null
                        && profile.getDisplayName() != null
                        && !profile.getDisplayName().isBlank()
                        ? profile.getDisplayName()
                        : user.getUsername();

        String avatarUrl = profile != null
                ? communityInfoService.buildImageUrl(profile.getAvatar())
                : null;

        return CommunityMemberResponseDTO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .displayName(displayName)
                .avatarUrl(avatarUrl)
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }

    /**
     * Maps a community to a lightweight preview DTO.
     */
    public CommunityPreviewResponseDTO toPreview(
            Community community,
            CommunityInfo info,
            long memberCount
    ) {
        return CommunityPreviewResponseDTO.builder()
                .id(community.getId())
                .name(community.getName())
                .description(info.getDescription())
                .avatarUrl(
                        communityInfoService.buildImageUrl(info.getAvatar())
                )
                .categoryName(
                        info.getCategory() != null
                                ? info.getCategory().getName()
                                : null
                )
                .communityStatus(community.getStatus())
                .visibility(community.getVisibility())
                .memberCount(memberCount)
                .createdAt(community.getCreatedAt())
                .build();
    }
}
package com.discuss.discuss.mapper.community;

import com.discuss.discuss.dto.community.CommunityMemberResponseDTO;
import com.discuss.discuss.entity.CommunityInfo;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.service.community.CommunityInfoService;
import lombok.RequiredArgsConstructor;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CommunityMemberMapper {

    private final CommunityInfoService communityInfoService;

    /*
     * Maps a community member to a response DTO.
     * Reused by member and moderator listing APIs.
     */
    public CommunityMemberResponseDTO toMemberDTO(CommunityMember member) {
        User user = member.getUser();
        UserProfile profile = user.getProfile();

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
}
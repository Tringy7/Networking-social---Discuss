package com.discuss.discuss.dto.community;

import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityDetailResponseDTO {

    private Long id;
    private String name;
    private String description;

    private String avatarUrl;
    private String bannerUrl;

    private Long categoryId;
    private String categoryName;

    private CommunityVisibility visibility;
    private CommunityStatus status;

    private long memberCount;
    private LocalDateTime createdAt;

    private List<CommunityMemberResponseDTO> moderators;
}
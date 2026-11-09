package com.discuss.discuss.dto.community;

import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityPreviewResponseDTO {

    private Long id;
    private String name;
    private String description;

    private String avatarUrl;

    private String categoryName;
    private CommunityStatus communityStatus;
    private CommunityVisibility visibility;

    private long memberCount;
    private LocalDateTime createdAt;
}

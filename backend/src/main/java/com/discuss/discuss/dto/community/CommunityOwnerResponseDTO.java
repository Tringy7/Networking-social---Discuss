package com.discuss.discuss.dto.community;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityOwnerResponseDTO {

    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
}
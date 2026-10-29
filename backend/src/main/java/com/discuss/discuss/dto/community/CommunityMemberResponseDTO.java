package com.discuss.discuss.dto.community;

import com.discuss.discuss.enums.CommunityRole;
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
public class CommunityMemberResponseDTO {

    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private CommunityRole role;
    private LocalDateTime joinedAt;
}

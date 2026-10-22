package com.discuss.discuss.dto.community;

import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.CommunityVisibility;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommunityDetailResponseDTO {

    private Long id;
    private String name;
    private String description;

    private String avatarUrl;
    private String bannerUrl;

    private Long categoryId;
    private String categoryName;

    private CommunityVisibility visibility;

    private long memberCount;
    private LocalDateTime createdAt;

    // Người xem đã là thành viên ACTIVE chưa
    private boolean joined;

    // null nếu chưa tham gia hoặc là khách
    private CommunityRole myRole;
}
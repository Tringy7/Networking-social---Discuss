package com.discuss.discuss.dto.user;

import com.discuss.discuss.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicUserProfileResponseDTO {

    private Long userId;
    private String username;
    private LocalDateTime joinedAt;

    private Profile profile;
    private Statistics statistics;
    private String role;
    private boolean showPostsOnProfile;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Profile {
        private String displayName;
        private String bio;
        private String avatar;
        private String banner;
        private String dateOfBirth;
        private Gender gender;
        private String location;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Statistics {
        private long postCount;
        private long commentCount;
        private long communityCount;
    }
}

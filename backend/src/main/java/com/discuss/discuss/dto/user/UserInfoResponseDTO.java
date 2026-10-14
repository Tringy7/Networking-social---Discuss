package com.discuss.discuss.dto.user;

import com.discuss.discuss.enums.Gender;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoResponseDTO {

    private String username;
    private String email;
    private UserRole role;
    private UserStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Profile profile;

    private PrivacySettings privacySettings;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Profile {
        private String displayName;
        private String bio;
        private String avatarObjectKey;
        private String bannerObjectKey;
        private LocalDate dateOfBirth;
        private Gender gender;
        private String location;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PrivacySettings {
        private boolean showBirthday;
        private boolean showBirthYear;
        private boolean showLocation;
        private boolean showPostsOnProfile;
    }
}
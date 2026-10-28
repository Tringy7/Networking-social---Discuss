package com.discuss.discuss.mapper.user;

import com.discuss.discuss.dto.user.PublicUserProfileResponseDTO;
import com.discuss.discuss.dto.user.UserInfoResponseDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserPrivacySettings;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.service.media.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final MinioService minioService;

    /**
     * Convert information of user to dto
     */
    public UserInfoResponseDTO toUserInfoResponse(
            User user,
            UserProfile profile,
            UserPrivacySettings privacySettings
    ) {
        UserInfoResponseDTO.Profile profileDTO = null;

        if (profile != null) {
            profileDTO = new UserInfoResponseDTO.Profile(
                    profile.getDisplayName(),
                    profile.getBio(),
                    this.minioService.buildFileUrl(profile.getAvatar()),
                    this.minioService.buildFileUrl(profile.getBanner()),
                    profile.getDateOfBirth(),
                    profile.getGender(),
                    profile.getLocation()
            );
        }

        UserInfoResponseDTO.PrivacySettings privacySettingsDTO = null;

        if (privacySettings != null) {
            privacySettingsDTO = new UserInfoResponseDTO.PrivacySettings(
                    privacySettings.isShowDateOfBirth(),
                    privacySettings.isShowLocation()
            );
        }

        return new UserInfoResponseDTO(
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                profileDTO,
                privacySettingsDTO
        );
    }

    /**
     * Convert information of user to public dto
     */
    public PublicUserProfileResponseDTO toPublicUserProfileResponse(
            User user,
            UserProfile profile,
            String dateOfBirth,
            String location,
            PublicUserProfileResponseDTO.Statistics statistics
    ) {
        PublicUserProfileResponseDTO.Profile profileDTO = null;

        if (profile != null) {
            profileDTO = new PublicUserProfileResponseDTO.Profile(
                    profile.getDisplayName(),
                    profile.getBio(),
                    profile.getAvatar(),
                    profile.getBanner(),
                    dateOfBirth,
                    profile.getGender(),
                    location
            );
        }

        return new PublicUserProfileResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getCreatedAt(),
                profileDTO,
                statistics
        );
    }
}
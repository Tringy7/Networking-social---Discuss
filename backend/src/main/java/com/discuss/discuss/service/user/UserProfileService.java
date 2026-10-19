package com.discuss.discuss.service.user;

import com.discuss.discuss.dto.user.PublicUserProfileResponseDTO;
import com.discuss.discuss.dto.user.UpdateProfileRequestDTO;
import com.discuss.discuss.dto.user.UserInfoResponseDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserPrivacySettings;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.mapper.user.UserMapper;
import com.discuss.discuss.mapper.user.UserUpdateMapper;
import com.discuss.discuss.repository.UserPrivacySettingsRepository;
import com.discuss.discuss.repository.UserProfileRepository;
import com.discuss.discuss.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserPrivacySettingsRepository privacyRepository;
    private final UserPrivacySettingsRepository userPrivacySettingsRepository;

    private final UserService userService;

    private final UserUpdateMapper updateMapper;
    private final UserMapper userMapper;


    @Transactional
    public void createUserProfile(User user, String displayName) {
        UserProfile profile = UserProfile.builder()
                .user(user)
                .displayName(displayName)
                .build();

        this.userProfileRepository.save(profile);
    }

    @Transactional
    public void createUserPrivacy(User user) {
        UserPrivacySettings privacySettings = UserPrivacySettings.builder()
                .user(user)
                .build();

        userPrivacySettingsRepository.save(privacySettings);
    }

    public UserInfoResponseDTO getUserProfile() {
        User user = this.userService.getCurrentUser();

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElse(null);

        UserPrivacySettings privacySettings =
                userPrivacySettingsRepository.findByUser(user)
                        .orElse(null);

        return userMapper.toUserInfoResponse(user, profile, privacySettings);
    }

    public PublicUserProfileResponseDTO getPublicUserProfile(Long userId) {
        User user = this.userService.getCurrentUser();

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElse(null);

        UserPrivacySettings privacySettings =
                userPrivacySettingsRepository.findByUser(user)
                        .orElse(null);

        String dateOfBirth = null;
        String location = null;

        if (profile != null && privacySettings != null) {
            LocalDate dob = profile.getDateOfBirth();

            // Check date of birth
            if (privacySettings.isShowDateOfBirth() && dob != null) {
                dateOfBirth = dob.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            }

            // Check location
            if (privacySettings.isShowLocation()) {
                location = profile.getLocation();
            }
        }

        PublicUserProfileResponseDTO.Statistics statistics =
                new PublicUserProfileResponseDTO.Statistics(
                        0L,
                        0L,
                        0L
                );

        return userMapper.toPublicUserProfileResponse(
                user,
                profile,
                dateOfBirth,
                location,
                statistics
        );
    }

    @Transactional
    public UserInfoResponseDTO updateProfile(UpdateProfileRequestDTO request) {
        User user = userService.getCurrentUser();

        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseGet(() -> UserProfile.builder().user(user).build());

        UserPrivacySettings privacy = privacyRepository.findByUser(user)
                .orElseGet(() -> UserPrivacySettings.builder().user(user).build());

        updateMapper.updateUser(request, user);
        updateMapper.updateProfile(request, profile);
        updateMapper.updatePrivacy(request, privacy);

        userProfileRepository.save(profile);
        privacyRepository.save(privacy);

        return this.getUserProfile();
    }
}
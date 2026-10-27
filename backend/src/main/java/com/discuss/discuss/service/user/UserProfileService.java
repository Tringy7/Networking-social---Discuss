package com.discuss.discuss.service.user;

import com.discuss.discuss.dto.user.PublicUserProfileResponseDTO;
import com.discuss.discuss.dto.user.UpdateProfileRequestDTO;
import com.discuss.discuss.dto.user.UserInfoResponseDTO;
import com.discuss.discuss.dto.user.UserSearchResultDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserPrivacySettings;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.mapper.user.UserMapper;
import com.discuss.discuss.mapper.user.UserUpdateMapper;
import com.discuss.discuss.repository.UserPrivacySettingsRepository;
import com.discuss.discuss.repository.UserProfileRepository;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.service.media.MinioService;
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
    private final UserRepository userRepository;
    private final MinioService minioService;

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

    @Transactional(readOnly = true)
    public PublicUserProfileResponseDTO getPublicUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .filter(target -> target.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new java.util.NoSuchElementException("User not found."));
        return toPublicProfile(user);
    }

    @Transactional(readOnly = true)
    public PublicUserProfileResponseDTO getPublicUserProfileByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .filter(target -> target.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new java.util.NoSuchElementException("User not found."));
        return toPublicProfile(user);
    }

    @Transactional(readOnly = true)
    public java.util.List<UserSearchResultDTO> searchUsers(String query) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.isEmpty()) return java.util.List.of();
        return userProfileRepository.searchActiveProfiles(
                        normalized, org.springframework.data.domain.PageRequest.of(0, 20))
                .stream()
                .map(profile -> new UserSearchResultDTO(
                        String.valueOf(profile.getUser().getId()),
                        profile.getUser().getUsername(),
                        profile.getDisplayName() == null
                                ? profile.getUser().getUsername() : profile.getDisplayName(),
                        profile.getBio(),
                        minioService.buildFileUrl(profile.getAvatar())
                ))
                .toList();
    }

    private PublicUserProfileResponseDTO toPublicProfile(User user) {
        UserProfile profile = userProfileRepository.findByUser(user).orElse(null);
        UserPrivacySettings privacySettings = userPrivacySettingsRepository.findByUser(user).orElse(null);
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
                new PublicUserProfileResponseDTO.Statistics(0, 0, 0);

        PublicUserProfileResponseDTO response = userMapper.toPublicUserProfileResponse(
                user,
                profile,
                dateOfBirth,
                location,
                statistics
        );
        response.setShowPostsOnProfile(privacySettings == null || privacySettings.isShowPostsOnProfile());
        if (profile != null && response.getProfile() != null) {
            response.getProfile().setAvatar(minioService.buildFileUrl(profile.getAvatar()));
            response.getProfile().setBanner(minioService.buildFileUrl(profile.getBanner()));
        }
        return response;
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
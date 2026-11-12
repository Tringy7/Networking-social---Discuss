package com.discuss.discuss.service.user;

import com.discuss.discuss.dto.user.UpdateProfileRequestDTO;
import com.discuss.discuss.dto.user.UserInfoResponseDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserPrivacySettings;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.mapper.user.UserMapper;
import com.discuss.discuss.mapper.user.UserUpdateMapper;
import com.discuss.discuss.repository.UserPrivacySettingsRepository;
import com.discuss.discuss.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository profileRepository;
    private final UserPrivacySettingsRepository privacyRepository;
    private final UserService userService;
    private final UserUpdateMapper updateMapper;
    private final UserMapper userMapper;

    @Transactional
    public void createProfile(User user, String displayName) {
        profileRepository.save(UserProfile.builder()
                .user(user)
                .displayName(displayName)
                .build());
    }

    @Transactional
    public void createProfileIfAbsent(User user, String displayName) {
        if (profileRepository.findByUser(user).isEmpty()) {
            createProfile(user, displayName);
        }
    }

    @Transactional
    public void upsertDisplayName(User user, String displayName) {
        UserProfile profile = findOrNewProfile(user);
        profile.setDisplayName(displayName);
        profileRepository.save(profile);
    }

    @Transactional(readOnly = true)
    public UserInfoResponseDTO getMyProfile() {
        return buildUserInfo(userService.getCurrentUser());
    }

    @Transactional
    public UserInfoResponseDTO updateMyProfile(UpdateProfileRequestDTO request) {
        User user = userService.getCurrentUser();
        UserProfile profile = findOrNewProfile(user);
        UserPrivacySettings privacy = findOrNewPrivacy(user);

        updateMapper.updateUser(request, user);
        updateMapper.updateProfile(request, profile);
        updateMapper.updatePrivacy(request, privacy);

        profileRepository.save(profile);
        privacyRepository.save(privacy);

        return buildUserInfo(user);
    }

    private UserInfoResponseDTO buildUserInfo(User user) {
        UserProfile profile = profileRepository.findByUser(user).orElse(null);
        UserPrivacySettings privacy = privacyRepository.findByUser(user).orElse(null);
        return userMapper.toUserInfoResponse(user, profile, privacy);
    }

    private UserProfile findOrNewProfile(User user) {
        return profileRepository.findByUser(user)
                .orElseGet(() -> UserProfile.builder().user(user).build());
    }

    private UserPrivacySettings findOrNewPrivacy(User user) {
        return privacyRepository.findByUser(user)
                .orElseGet(() -> UserPrivacySettings.builder().user(user).build());
    }
}

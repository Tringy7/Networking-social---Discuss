package com.discuss.discuss.service.user;

import com.discuss.discuss.dto.user.PublicUserProfileResponseDTO;
import com.discuss.discuss.dto.user.UpdateProfileRequestDTO;
import com.discuss.discuss.dto.user.UserInfoResponseDTO;
import com.discuss.discuss.dto.user.UserSearchResultDTO;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserPrivacySettings;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.user.UserErrorCode;
import com.discuss.discuss.exception.user.UserException;
import com.discuss.discuss.mapper.user.UserMapper;
import com.discuss.discuss.mapper.user.UserUpdateMapper;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.repository.UserPrivacySettingsRepository;
import com.discuss.discuss.repository.UserProfileRepository;
import com.discuss.discuss.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserPrivacySettingsRepository privacyRepository;
    private final UserPrivacySettingsRepository userPrivacySettingsRepository;
    private final UserRepository userRepository;

    private final UserService userService;

    private final UserUpdateMapper updateMapper;
    private final UserMapper userMapper;
    private final PageMapper pageMapper;

    @Transactional(readOnly = true)
    public PageResponseDTO<UserSearchResultDTO> searchUsers(String query, int page, int size) {
        String keyword = query == null ? "" : query.trim();
        if (keyword.length() < 2 || keyword.length() > 50) {
            throw new UserException(UserErrorCode.INVALID_SEARCH_QUERY);
        }
        if (page < 0) {
            throw new UserException(UserErrorCode.INVALID_SEARCH_PAGE);
        }
        if (size < 1 || size > 50) {
            throw new UserException(UserErrorCode.INVALID_SEARCH_SIZE);
        }

        // Treat SQL LIKE wildcards as literal characters in the search term.
        String pattern = "%" + keyword.toLowerCase(Locale.ROOT)
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_") + "%";
        PageRequest pageable = PageRequest.of(page, size, Sort.by("username", "id"));

        return pageMapper.toResponse(userRepository
                .searchByUsernameOrDisplayName(pattern, UserStatus.ACTIVE, pageable)
                .map(userMapper::toSearchResult));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
    }

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

    public PublicUserProfileResponseDTO getPublicUserProfileWithName(String username) {
        User user = this.getUserByUsername(username);

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

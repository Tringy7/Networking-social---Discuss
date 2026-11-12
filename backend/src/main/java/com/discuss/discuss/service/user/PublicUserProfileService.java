package com.discuss.discuss.service.user;

import com.discuss.discuss.dto.user.PublicUserProfileResponseDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserPrivacySettings;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.mapper.user.UserMapper;
import com.discuss.discuss.repository.UserPrivacySettingsRepository;
import com.discuss.discuss.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class PublicUserProfileService {

    private static final DateTimeFormatter DOB_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final UserService userService;
    private final UserProfileRepository profileRepository;
    private final UserPrivacySettingsRepository privacyRepository;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public PublicUserProfileResponseDTO getById(Long userId) {
        return buildPublicProfile(userService.getById(userId));
    }

    @Transactional(readOnly = true)
    public PublicUserProfileResponseDTO getByUsername(String username) {
        return buildPublicProfile(userService.getByUsername(username));
    }

    private PublicUserProfileResponseDTO buildPublicProfile(User user) {
        UserProfile profile = profileRepository.findByUser(user).orElse(null);
        UserPrivacySettings privacy = privacyRepository.findByUser(user).orElse(null);

        return userMapper.toPublicUserProfileResponse(
                user,
                profile,
                resolveVisibleDateOfBirth(profile, privacy),
                resolveVisibleLocation(profile, privacy),
                emptyStatistics()
        );
    }

    private String resolveVisibleDateOfBirth(UserProfile profile, UserPrivacySettings privacy) {
        if (profile == null || privacy == null) {
            return null;
        }
        LocalDate dateOfBirth = profile.getDateOfBirth();
        return privacy.isShowDateOfBirth() && dateOfBirth != null
                ? dateOfBirth.format(DOB_FORMAT)
                : null;
    }

    private String resolveVisibleLocation(UserProfile profile, UserPrivacySettings privacy) {
        if (profile == null || privacy == null) {
            return null;
        }
        return privacy.isShowLocation() ? profile.getLocation() : null;
    }

    private PublicUserProfileResponseDTO.Statistics emptyStatistics() {
        return new PublicUserProfileResponseDTO.Statistics(0L, 0L, 0L);
    }
}

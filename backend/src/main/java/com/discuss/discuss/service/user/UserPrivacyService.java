package com.discuss.discuss.service.user;

import com.discuss.discuss.dto.user.UserInfoResponseDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserPrivacySettings;
import com.discuss.discuss.repository.UserPrivacySettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserPrivacyService {

    private final UserPrivacySettingsRepository privacyRepository;

    private final UserService userService;

    @Transactional
    public UserInfoResponseDTO.PrivacySettings updateMyPrivacy(Boolean showDateOfBirth, Boolean showLocation) {
        User user = userService.getCurrentUser();
        UserPrivacySettings settings = privacyRepository.findByUser(user)
                .orElseGet(() -> UserPrivacySettings.builder()
                        .user(user)
                        .showDateOfBirth(false)
                        .showLocation(false)
                        .build());

        if (showDateOfBirth != null) {
            settings.setShowDateOfBirth(showDateOfBirth);
        }
        if (showLocation != null) {
            settings.setShowLocation(showLocation);
        }
        if (showDateOfBirth != null || showLocation != null) {
            privacyRepository.save(settings);
        }

        return new UserInfoResponseDTO.PrivacySettings(
                settings.isShowDateOfBirth(), settings.isShowLocation());
    }

    @Transactional
    public void createDefaultPrivacy(User user) {
        privacyRepository.save(UserPrivacySettings.builder()
                .user(user)
                .build());
    }
}

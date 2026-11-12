package com.discuss.discuss.service.user;

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

    @Transactional
    public void createDefaultPrivacy(User user) {
        privacyRepository.save(UserPrivacySettings.builder()
                .user(user)
                .build());
    }
}

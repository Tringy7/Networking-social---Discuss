package com.discuss.discuss.repository;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserPrivacySettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserPrivacySettingsRepository extends JpaRepository<UserPrivacySettings, Long> {
    Optional<UserPrivacySettings> findByUser(User user);

}

package com.discuss.discuss.service.user;

import com.discuss.discuss.entity.*;
import com.discuss.discuss.repository.UserPrivacySettingsRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class UserPrivacyServiceTest {
    private final UserPrivacySettingsRepository repository = mock(UserPrivacySettingsRepository.class);
    private final UserService users = mock(UserService.class);
    private final UserPrivacyService privacy = new UserPrivacyService(repository, users);
    private final User user = User.builder().id(1L).build();

    @Test
    void partialUpdatePreservesOtherPreference() {
        UserPrivacySettings settings = UserPrivacySettings.builder().user(user)
                .showDateOfBirth(true).showLocation(true).build();
        when(users.getCurrentUser()).thenReturn(user);
        when(repository.findByUser(user)).thenReturn(Optional.of(settings));

        var response = privacy.updateMyPrivacy(false, null);

        assertThat(response.isShowDateOfBirth()).isFalse();
        assertThat(response.isShowLocation()).isTrue();
        verify(repository).save(settings);
    }

    @Test
    void emptyUpdateReturnsDefaultsWithoutWritingSettings() {
        when(users.getCurrentUser()).thenReturn(user);

        var response = privacy.updateMyPrivacy(null, null);

        assertThat(response.isShowDateOfBirth()).isFalse();
        assertThat(response.isShowLocation()).isFalse();
        verify(repository, never()).save(any());
    }
}

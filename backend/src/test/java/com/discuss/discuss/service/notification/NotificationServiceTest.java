package com.discuss.discuss.service.notification;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.repository.NotificationRepository;
import com.discuss.discuss.service.user.UserService;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class NotificationServiceTest {
    private final NotificationRepository repository = mock(NotificationRepository.class);
    private final UserService users = mock(UserService.class);
    private final NotificationService notifications = new NotificationService(repository, users, null, null);

    @Test
    void markingAnAlreadyReadNotificationIsIdempotentForItsRecipient() {
        when(users.getCurrentUser()).thenReturn(User.builder().id(1L).build());
        when(repository.existsByIdAndRecipientId(4L, 1L)).thenReturn(true);

        assertThat(notifications.markNotificationAsRead(4L)).isTrue();
        verify(repository).markRead(eq(4L), eq(1L), any(LocalDateTime.class));
    }

    @Test
    void cannotMarkReadWhenNotificationDoesNotBelongToRecipient() {
        when(users.getCurrentUser()).thenReturn(User.builder().id(2L).build());

        assertThat(notifications.markNotificationAsRead(4L)).isFalse();
        verify(repository).markRead(eq(4L), eq(2L), any(LocalDateTime.class));
        verify(repository).existsByIdAndRecipientId(4L, 2L);
    }
}

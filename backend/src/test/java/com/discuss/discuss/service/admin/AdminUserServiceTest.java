package com.discuss.discuss.service.admin;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.user.UserException;
import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.service.user.UserService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminUserServiceTest {
    private final UserService users = mock(UserService.class);
    private final ActivityLogService activity = mock(ActivityLogService.class);
    private final AdminUserService admin = new AdminUserService(null, users, activity);

    @Test
    void adminCannotLockOwnAccount() {
        User actor = User.builder().id(1L).status(UserStatus.ACTIVE).build();
        when(users.getById(1L)).thenReturn(actor);
        when(users.getCurrentUser()).thenReturn(actor);

        assertThatThrownBy(() -> admin.lockUser(1L)).isInstanceOf(UserException.class);
        verify(users, never()).updateStatus(actor, UserStatus.LOCKED);
        verifyNoInteractions(activity);
    }

    @Test
    void unlockingRecordsAuditOnlyForAStatusChange() {
        User target = User.builder().id(2L).status(UserStatus.LOCKED).build();
        when(users.getById(2L)).thenReturn(target);

        admin.unlockUser(2L);
        target.setStatus(UserStatus.ACTIVE);
        admin.unlockUser(2L);

        var calls = inOrder(users, activity);
        calls.verify(users).requireStatus(target, UserStatus.LOCKED);
        calls.verify(users).updateStatus(target, UserStatus.ACTIVE);
        calls.verify(activity).record("UNLOCK_USER", "USER", 2L, null);
        verify(users, times(1)).updateStatus(target, UserStatus.ACTIVE);
        verifyNoMoreInteractions(activity);
    }
}

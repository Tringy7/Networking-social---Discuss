package com.discuss.discuss.service.user;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.exception.user.UserErrorCode;
import com.discuss.discuss.exception.user.UserException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserAuthorizationService {
    private final UserService userService;

    public void requireUser() {
        requireRole(UserRole.USER);
    }

    public void requireAdmin() {
        requireRole(UserRole.ADMIN);
    }

    private void requireRole(UserRole role) {
        User user = userService.getCurrentUser();
        if (role == null || user.getRole() != role) {
            throw new UserException(UserErrorCode.ROLE_REQUIRED);
        }
    }
}

package com.discuss.discuss.service.admin;

import com.discuss.discuss.dto.admin.AdminResponse;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.user.UserErrorCode;
import com.discuss.discuss.exception.user.UserException;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@HasRole("ADMIN")
public class AdminUserService {

    private final PageMapper pageMapper;
    private final UserService userService;
    private final ActivityLogService activityLogService;

    public PageResponseDTO<AdminResponse.UserItem> getUsers(Pageable pageable, String status, UserRole role) {
        var result = userService.findForManagement(pageable, toUserStatus(status), role, null);
        return pageMapper.toResponse(result.map(this::toItem));
    }

    public PageResponseDTO<AdminResponse.UserItem> searchUsers(
            Pageable pageable,
            String search,
            String status,
            UserRole role
    ) {
        var result = userService.findForManagement(pageable, toUserStatus(status), role, search);
        return pageMapper.toResponse(result.map(this::toItem));
    }

    @Transactional
    public void lockUser(Long userId) {
        updateUserStatus(userId, UserStatus.LOCKED);
    }

    @Transactional
    public void unlockUser(Long userId) {
        updateUserStatus(userId, UserStatus.ACTIVE);
    }

    private void updateUserStatus(Long userId, UserStatus status) {
        User user = userService.getById(userId);
        if (user.getStatus() == status) {
            return;
        }

        if (status == UserStatus.LOCKED) {
            if (user.getId().equals(userService.getCurrentUser().getId())) {
                throw new UserException(
                        UserErrorCode.INVALID_USER_STATUS, "You cannot lock your own account");
            }
            userService.requireStatus(user, UserStatus.ACTIVE);
        } else {
            userService.requireStatus(user, UserStatus.LOCKED);
        }

        userService.updateStatus(user, status);
        activityLogService.record(
                status == UserStatus.LOCKED ? "LOCK_USER" : "UNLOCK_USER",
                "USER", userId, null);
    }

    private UserStatus toUserStatus(String status) {
        if (status == null) {
            return null;
        }
        return switch (status) {
            case "ACTIVE" -> UserStatus.ACTIVE;
            case "SUSPENDED" -> UserStatus.LOCKED;
            default -> throw new IllegalArgumentException("Unsupported admin user status: " + status);
        };
    }

    private AdminResponse.UserItem toItem(User user) {
        var profile = user.getProfile();
        return new AdminResponse.UserItem(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                profile == null ? null : profile.getDisplayName(),
                profile == null ? null : profile.getAvatar(),
                user.getRole().name(),
                user.getStatus() == UserStatus.LOCKED ? "SUSPENDED" : user.getStatus().name(),
                user.getCreatedAt()
        );
    }
}

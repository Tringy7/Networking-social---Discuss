package com.discuss.discuss.service.admin;

import com.discuss.discuss.dto.admin.AdminResponse;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.service.user.UserSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final UserSpecifications userSpecifications;
    private final PageMapper pageMapper;
    private final UserService userService;

    public PageResponseDTO<AdminResponse.UserItem> getUsers(Pageable pageable, String status, UserRole role) {
        var result = userRepository.findAll(
                userSpecifications.hasStatus(toUserStatus(status))
                        .and(userSpecifications.hasRole(role)),
                pageable
        );
        return pageMapper.toResponse(result.map(this::toItem));
    }

    public PageResponseDTO<AdminResponse.UserItem> searchUsers(
            Pageable pageable,
            String search,
            String status,
            UserRole role
    ) {
        var specification = userSpecifications.hasStatus(toUserStatus(status))
                .and(userSpecifications.hasRole(role))
                .and(userSpecifications.matchesUsernameOrEmail(search));
        var result = userRepository.findAll(specification, pageable);
        return pageMapper.toResponse(result.map(this::toItem));
    }

    @Transactional
    public void lockUser(Long userId) {
        User user = userService.getById(userId);
        if (user.getStatus() == UserStatus.LOCKED) {
            return;
        }
        userService.requireStatus(user, UserStatus.ACTIVE);
        userService.updateStatus(user, UserStatus.LOCKED);
    }

    @Transactional
    public void unlockUser(Long userId) {
        User user = userService.getById(userId);
        if (user.getStatus() == UserStatus.ACTIVE) {
            return;
        }
        userService.requireStatus(user, UserStatus.LOCKED);
        userService.updateStatus(user, UserStatus.ACTIVE);
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

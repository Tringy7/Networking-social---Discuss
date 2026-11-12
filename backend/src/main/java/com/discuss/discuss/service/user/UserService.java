package com.discuss.discuss.service.user;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.dto.admin.AdminResponse;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.exception.user.UserErrorCode;
import com.discuss.discuss.exception.user.UserException;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.auth.JwtService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    private final JwtService jwtService;
    private final UserSpecifications userSpecifications;
    private final PageMapper pageMapper;

    public User getCurrentUser() {
        String username = jwtService.getCurrentUserLogin()
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.INVALID_CREDENTIALS)
                );

        return userRepository.findByUsername(username)
                .filter(existingUser ->
                        existingUser.getStatus() == UserStatus.ACTIVE
                )
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND)
                );
    }

    public User getUserActive(String username) {
        return userRepository.findByUsername(username)
                .filter(existingUser -> existingUser.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
    }

    public long countAll() {
        return userRepository.count();
    }

    public long countByStatus(UserStatus status) {
        return userRepository.countByStatus(status);
    }

    public boolean existsUserById(Long userId) {
        return userRepository.existsById(userId);
    }


    public PageResponseDTO<AdminResponse.UserItem> getUsers(Pageable pageable, String status) {
        var result = userRepository.findAll(userSpecifications.hasStatus(toAdminUserStatus(status)), pageable);
        return pageMapper.toResponse(result.map(this::toItem));
    }

    public PageResponseDTO<AdminResponse.UserItem> searchUsers(Pageable pageable, String search, String status) {
        var specification = userSpecifications.hasStatus(toAdminUserStatus(status))
                .and(userSpecifications.matchesUsernameOrEmail(search));
        var result = userRepository.findAll(specification, pageable);
        return pageMapper.toResponse(result.map(this::toItem));
    }

    public void checkUserStatus(User user, UserStatus expectedStatus) {
        if (user.getStatus() != expectedStatus) {
            throw new UserException(
                    UserErrorCode.INVALID_USER_STATUS,
                    "User must have status " + expectedStatus
                            + ", current status: " + user.getStatus()
            );
        }
    }

    public User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
    }

    public void saveStatusForUser(User user, UserStatus status) {
        user.setStatus(status);
        userRepository.save(user);
    }

    private UserStatus toAdminUserStatus(String status) {
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
        return new AdminResponse.UserItem(user.getId(), user.getUsername(), user.getEmail(),
                profile == null ? null : profile.getDisplayName(),
                profile == null ? null : profile.getAvatar(), user.getRole().name(),
                user.getStatus() == UserStatus.LOCKED ? "SUSPENDED" : user.getStatus().name(),
                user.getCreatedAt());
    }
}

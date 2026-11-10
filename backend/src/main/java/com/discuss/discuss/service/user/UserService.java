package com.discuss.discuss.service.user;

import com.discuss.discuss.dto.admin.AdminResponse.*;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.mapper.page.PageMapper;
import org.springframework.data.domain.Pageable;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.exception.user.UserErrorCode;
import com.discuss.discuss.exception.user.UserException;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.auth.JwtService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserSpecifications userSpecifications;

    private final JwtService jwtService;
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

    public PageResponseDTO<UserItem> findAllListUsers(Pageable pageable, UserStatus status) {
        var result = userRepository.findAll(userSpecifications.hasStatus(status), pageable);
        return pageMapper.toResponse(result.map(this::toItem));
    }

    public PageResponseDTO<UserItem> searchAdminUsers(Pageable pageable, String search, UserStatus status) {
        var specification = userSpecifications.hasStatus(status)
                .and(userSpecifications.matchesUsernameOrEmail(search));
        var result = userRepository.findAll(specification, pageable);
        return pageMapper.toResponse(result.map(this::toItem));
    }

    private UserItem toItem(User user) {
        var profile = user.getProfile();
        return new UserItem(user.getId(), user.getUsername(), user.getEmail(),
                profile == null ? null : profile.getDisplayName(),
                profile == null ? null : profile.getAvatar(), user.getRole().name(),
                user.getStatus() == UserStatus.LOCKED ? "SUSPENDED" : user.getStatus().name(),
                user.getCreatedAt());
    }
}

package com.discuss.discuss.service.user;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.exception.user.UserErrorCode;
import com.discuss.discuss.exception.user.UserException;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.auth.JwtService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final UserSpecifications userSpecifications;

    @Transactional(readOnly = true)
    public User getCurrentUser() {
        String username = jwtService.getCurrentUserLogin()
                .orElseThrow(() -> new AuthException(AuthErrorCode.INVALID_CREDENTIALS));

        return userRepository.findByUsername(username)
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new AuthException(AuthErrorCode.USER_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public User getById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public User getActiveByUsername(String username) {
        User user = getByUsername(username);
        requireStatus(user, UserStatus.ACTIVE);
        return user;
    }

    @HasRole("ADMIN")
    public long countAll() {
        return userRepository.count();
    }

    @HasRole("ADMIN")
    public long countByStatus(UserStatus status) {
        return userRepository.countByStatus(status);
    }

    public void requireStatus(User user, UserStatus expected) {
        if (user.getStatus() != expected) {
            throw new UserException(
                    UserErrorCode.INVALID_USER_STATUS,
                    "User must have status " + expected + ", current status: " + user.getStatus()
            );
        }
    }

    @HasRole("ADMIN")
    @Transactional
    public void updateStatus(User user, UserStatus status) {
        user.setStatus(status);
        userRepository.save(user);
    }
    @HasRole("ADMIN")
    @Transactional(readOnly = true)
    public Page<User> findForManagement(
            Pageable pageable, UserStatus status,
            UserRole role, String search) {
        var filter = userSpecifications.hasStatus(status).and(userSpecifications.hasRole(role));
        if (search != null && !search.isBlank()) filter = filter.and(userSpecifications.matchesUsernameOrEmail(search));
        return userRepository.findAll(filter, pageable);
    }

}

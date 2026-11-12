package com.discuss.discuss.service.user;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.exception.user.UserErrorCode;
import com.discuss.discuss.exception.user.UserException;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.auth.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

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

    public long countAll() {
        return userRepository.count();
    }

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

    @Transactional
    public void updateStatus(User user, UserStatus status) {
        user.setStatus(status);
        userRepository.save(user);
    }
}

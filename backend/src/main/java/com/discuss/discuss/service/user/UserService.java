package com.discuss.discuss.service.user;

import com.discuss.discuss.dto.auth.AuthResponseDTO;
import com.discuss.discuss.dto.user.PublicUserProfileResponseDTO;
import com.discuss.discuss.dto.user.UserInfoResponseDTO;
import com.discuss.discuss.entity.RefreshToken;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserPrivacySettings;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.exception.user.UserErrorCode;
import com.discuss.discuss.exception.user.UserException;
import com.discuss.discuss.mapper.user.UserMapper;
import com.discuss.discuss.repository.RefreshTokenRepository;
import com.discuss.discuss.repository.UserPrivacySettingsRepository;
import com.discuss.discuss.repository.UserProfileRepository;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.auth.JwtService;
import com.discuss.discuss.service.auth.TokenService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
@AllArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    private final JwtService jwtService;

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
}

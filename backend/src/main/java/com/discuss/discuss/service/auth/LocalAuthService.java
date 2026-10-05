package com.discuss.discuss.service.auth;

import com.discuss.discuss.dto.auth.AuthResult;
import com.discuss.discuss.dto.auth.AuthResponseDTO;
import com.discuss.discuss.dto.auth.RegisterRequestDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.mapper.auth.AuthMapper;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.auth.email.EmailVerificationService;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LocalAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;
    private final AuthMapper authMapper;
    private final UserService userService;
    private final TokenService tokenService;

    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO request) {

        String normalizedEmail = normalize(request.getEmail());

        User user = userRepository.findByEmail(normalizedEmail)
                .map(existingUser -> handleExistingUser(existingUser, request))
                .orElseGet(() -> createPendingUser(request, normalizedEmail));

        String message = emailVerificationService.generateAndSendCode(
                user.getEmail(),
                user.getUsername()
        );

        return authMapper.toRegisterResponse(user, message);
    }

    public void resendOtp(String email) {
        emailVerificationService.resendCode(normalize(email));
    }

    @Transactional
    public AuthResult verifyEmailAndIssueTokens(
            String email,
            String code
    ) {

        String normalizedEmail = normalize(email);

        emailVerificationService.verifyCode(
                normalizedEmail,
                code
        );

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND)
                );

        user.setStatus(UserStatus.ACTIVE);

        userService.createUserProfile(user);

        return tokenService.issueTokens(user);
    }

    @Transactional
    public AuthResult login(
            String username,
            String rawPassword
    ) {

        User user = userRepository.findByUsername(username.trim())
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.INVALID_CREDENTIALS)
                );

        validateCredentials(user, rawPassword);
        validateAccountStatus(user);

        return tokenService.issueTokens(user);
    }

    private void validateCredentials(
            User user,
            String rawPassword
    ) {

        if (user.getPassword() == null) {
            throw new AuthException(
                    AuthErrorCode.INVALID_CREDENTIALS
            );
        }

        if (!passwordEncoder.matches(
                rawPassword,
                user.getPassword()
        )) {
            throw new AuthException(
                    AuthErrorCode.INVALID_CREDENTIALS
            );
        }
    }

    private void validateAccountStatus(User user) {

        switch (user.getStatus()) {

            case PENDING ->
                    throw new AuthException(
                            AuthErrorCode.ACCOUNT_NOT_VERIFIED
                    );

            case LOCKED ->
                    throw new AuthException(
                            AuthErrorCode.ACCOUNT_LOCKED
                    );

            case DELETED ->
                    throw new AuthException(
                            AuthErrorCode.INVALID_CREDENTIALS
                    );

            case ACTIVE -> {
                // Account is valid
            }
        }
    }

    private User handleExistingUser(
            User existingUser,
            RegisterRequestDTO request
    ) {

        if (existingUser.getStatus() == UserStatus.ACTIVE) {
            throw new AuthException(
                    AuthErrorCode.EMAIL_ALREADY_EXISTS
            );
        }

        String username = resolveUsername(
                request.getUsername(),
                existingUser
        );

        existingUser.setUsername(username);
        existingUser.setPassword(
                passwordEncoder.encode(request.getPassword())
        );
        existingUser.setRole(UserRole.USER);
        existingUser.setStatus(UserStatus.PENDING);

        return existingUser;
    }

    private User createPendingUser(
            RegisterRequestDTO request,
            String normalizedEmail
    ) {

        if (userRepository.existsByUsername(
                request.getUsername()
        )) {
            throw new AuthException(
                    AuthErrorCode.USERNAME_ALREADY_EXISTS
            );
        }

        User user = User.builder()
                .email(normalizedEmail)
                .password(
                        passwordEncoder.encode(
                                request.getPassword()
                        )
                )
                .username(request.getUsername())
                .role(UserRole.USER)
                .status(UserStatus.PENDING)
                .build();

        return userRepository.save(user);
    }

    private String resolveUsername(
            String requestedUsername,
            User existingUser
    ) {

        if (requestedUsername.equals(
                existingUser.getUsername()
        )) {
            return requestedUsername;
        }

        if (userRepository.existsByUsername(
                requestedUsername
        )) {
            throw new AuthException(
                    AuthErrorCode.USERNAME_ALREADY_EXISTS
            );
        }

        return requestedUsername;
    }

    private String normalize(String email) {
        return email == null
                ? null
                : email.trim().toLowerCase();
    }
}
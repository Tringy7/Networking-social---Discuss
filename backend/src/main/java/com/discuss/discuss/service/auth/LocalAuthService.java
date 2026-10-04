package com.discuss.discuss.service.auth;

import com.discuss.discuss.dto.auth.AuthResult;
import com.discuss.discuss.dto.auth.AuthResponseDTO;
import com.discuss.discuss.dto.auth.RegisterRequestDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.*;
import com.discuss.discuss.mapper.auth.AuthMapper;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.auth.TokenService;
import com.discuss.discuss.service.auth.email.EmailVerificationService;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

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

        Optional<User> existingUserOpt = userRepository.findByEmail(normalizedEmail);
        User user;

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();

            if (existingUser.getStatus() == UserStatus.ACTIVE) {
                throw new EmailAlreadyExistsException(normalizedEmail);
            }

            existingUser.setUsername(resolveUsername(request.getUsername(), existingUser));
            existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
            user = existingUser;

        } else {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new UsernameAlreadyExistsException(request.getUsername());
            }

            user = User.builder()
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(request.getPassword()))
                    .username(request.getUsername())
                    .role(UserRole.USER)
                    .status(UserStatus.PENDING)
                    .build();

            userRepository.save(user);
        }

        String message = emailVerificationService.generateAndSendCode(user.getEmail(), user.getUsername());

        return authMapper.toRegisterResponse(user, message);
    }

    public void resendOtp(String email) {
        emailVerificationService.resendCode(email);
    }

    @Transactional
    public AuthResult verifyEmailAndIssueTokens(String email, String code) {
        String normalizedEmail = normalize(email);

        emailVerificationService.verifyCode(normalizedEmail, code);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UserNotFoundException("User not exist"));

        userService.createUserProfile(user);

        return tokenService.issueTokens(user);
    }

    @Transactional
    public AuthResult login(String username, String rawPassword) {
        User user = userRepository.findByUsername(username.trim())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

        validateCredentials(user, rawPassword);
        validateAccountStatus(user);

        return tokenService.issueTokens(user);
    }

    private void validateCredentials(User user, String rawPassword) {
        if (user.getPassword() == null) {
            throw new InvalidCredentialsException(
                    "This account uses social login. Please sign in with " + user.getProvider().name());
        }
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new InvalidCredentialsException("Invalid username or password");
        }
    }

    private void validateAccountStatus(User user) {
        switch (user.getStatus()) {
//            case PENDING -> throw new AccountNotVerifiedException("Please verify your email before logging in");
//            case LOCKED -> throw new AccountLockedException("This account has been locked");
            case DELETED -> throw new InvalidCredentialsException("Invalid username or password");
            case ACTIVE -> { /* OK, continued */ }
        }
    }

    private String resolveUsername(String requestedUsername, User existingUser) {
        if (requestedUsername.equals(existingUser.getUsername())) {
            return requestedUsername;
        }
        if (userRepository.existsByUsername(requestedUsername)) {
            throw new UsernameAlreadyExistsException(requestedUsername);
        }
        return requestedUsername;
    }

    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
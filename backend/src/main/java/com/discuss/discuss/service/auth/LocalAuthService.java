package com.discuss.discuss.service.auth;

import com.discuss.discuss.controller.auth.AuthController;
import com.discuss.discuss.dto.auth.AuthResult;
import com.discuss.discuss.dto.auth.AuthResponseDTO;
import com.discuss.discuss.dto.auth.LoginRequestDTO;
import com.discuss.discuss.dto.auth.RegisterRequestDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.OtpPurpose;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.mapper.auth.AuthMapper;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.auth.email.EmailVerificationService;
import com.discuss.discuss.service.auth.email.PasswordResetTokenService;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final AuthenticationManagerBuilder authenticationManagerBuilder;

    private final UserService userService;
    private final TokenService tokenService;
    private final PasswordResetTokenService passwordResetTokenService;
    private final JwtService jwtService;

    /*
        Register new user local
     */
    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO request) {

        String normalizedEmail = normalize(request.getEmail());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new AuthException(AuthErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseGet(() -> createPendingUser(request, normalizedEmail));

        String message = emailVerificationService.generateAndSendOtp(
                OtpPurpose.VERIFY_EMAIL,
                user.getEmail(),
                user.getUsername()
        );

        return authMapper.toResponse(user, message);
    }

    public void resendOtp(String email) {
        emailVerificationService.resendCode(normalize(email));
    }

    @Transactional
    public AuthResponseDTO verifyEmailAndIssueTokens(
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

        return authMapper.toResponse(user, "Email verified successfully");

    }

    @Transactional
    public AuthResult login(LoginRequestDTO loginRequestDTO) {
        try {
            UsernamePasswordAuthenticationToken authenticationToken =
                    new UsernamePasswordAuthenticationToken(
                            loginRequestDTO.getUsername(),
                            loginRequestDTO.getPassword()
                    );

            Authentication authentication =
                    authenticationManagerBuilder
                            .getObject()
                            .authenticate(authenticationToken);

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository
                    .findByUsername(authentication.getName().trim())
                    .orElseThrow(() ->
                            new AuthException(AuthErrorCode.INVALID_CREDENTIALS)
                    );

            validateAccountStatus(user);

            return tokenService.issueTokens(user);

        } catch (BadCredentialsException ex) {
            throw new AuthException(AuthErrorCode.INVALID_CREDENTIALS);
        }
    }

    @Transactional
    public void forgotPassword(String email) {
        String normalizedEmail = normalize(email);

        User user = this.checkEmailValid(normalizedEmail);

        String message = emailVerificationService.generateAndSendOtp(
                OtpPurpose.FORGOT_PASSWORD,
                user.getEmail(),
                user.getUsername()
        );
    }

    @Transactional
    public String verifyForgotPassword(String email, String code) {
        String normalizedEmail = normalize(email);

        emailVerificationService.verifyCodeForForgotPassword(
                normalizedEmail,
                code
        );

        return passwordResetTokenService.generateToken(normalizedEmail);
    }

    @Transactional
    public void resetPassword(String resetToken, String newPassword) {

        String email = passwordResetTokenService.getEmailByToken(resetToken);

        User user = userRepository.findByEmail(email)
                .filter(existingUser ->
                        existingUser.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND)
                );

        user.setPassword(passwordEncoder.encode(newPassword));

        userRepository.save(user);

        passwordResetTokenService.consumeToken(resetToken);
    }

    @Transactional
    public void changePassword(String newPassword) {
        String username = jwtService.getCurrentUserLogin()
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.INVALID_CREDENTIALS)
                );

        User user = userRepository.findByUsername(username)
                .filter(existingUser -> existingUser.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND)
                );

        user.setPassword(passwordEncoder.encode(newPassword));

        userRepository.save(user);
    }

    private User checkEmailValid(String email) {
        return  userRepository.findByEmail(email)
                .filter(userCheck -> userCheck.getStatus() == UserStatus.ACTIVE)
                .filter(userCheck -> userCheck.getPassword() != null)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND));
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

    /*
        Create user with status pending
     */
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

    /*
        Normalize email
     */
    private String normalize(String email) {
        return email == null
                ? null
                : email.trim().toLowerCase();
    }
}
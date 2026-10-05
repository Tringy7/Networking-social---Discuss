package com.discuss.discuss.service.auth.email;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailVerificationService {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final EmailService emailService;

    public String generateAndSendCode(String email, String username) {
        String normalizedEmail = normalize(email);

        if (otpService.isInCooldown(normalizedEmail)) {
            throw new AuthException(AuthErrorCode.OTP_COOLDOWN,
                    "Please wait " + otpService.getCooldownSeconds()
                            + " seconds before requesting a new code");
        }

        String code = otpService.generateOtp(normalizedEmail);
        emailService.sendOtpEmail(normalizedEmail, username, code);

        log.info("OTP generated and sent for user: {}", normalizedEmail);
        String message = "Email send successfully";
        return message;
    }

    @Transactional
    public void verifyCode(String email, String code) {
        String normalizedEmail = normalize(email);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new AuthException(AuthErrorCode.ACCOUNT_ALREADY_EXISTS);
        }

        boolean isValid = otpService.verifyOtp(normalizedEmail, code);

        if (!isValid) {
            throw new AuthException(AuthErrorCode.INVALID_VERIFICATION_CODE);
        }

        user.setStatus(UserStatus.ACTIVE);

        log.info("Account verified successfully for user: {}", normalizedEmail);
    }

    @Transactional(readOnly = true)
    public void resendCode(String email) {
        String normalizedEmail = normalize(email);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new AuthException(AuthErrorCode.ACCOUNT_ALREADY_EXISTS);
        }

        generateAndSendCode(user.getEmail(), user.getUsername());
    }

    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
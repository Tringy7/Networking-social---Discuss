package com.discuss.discuss.service.auth.email;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.OtpPurpose;
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

    /*
        Generate otp and send opt with mail of user
     */
    public String generateAndSendOtp(OtpPurpose purpose, String email, String username) {
        String normalizedEmail = normalize(email);

        if (otpService.isInCooldown(purpose, normalizedEmail)) {
            throw new AuthException(AuthErrorCode.OTP_COOLDOWN,
                    "Please wait " + otpService.getCooldownSeconds()
                            + " seconds before requesting a new code");
        }

        String code = otpService.generateOtp(purpose, normalizedEmail);
        emailService.sendOtpEmail(purpose, normalizedEmail, username, code);

        log.info("OTP [{}] sent to: {}", purpose, normalizedEmail);
        return "Verification code has been sent";
    }

    /*
        Verify otp
     */
    @Transactional
    public void verifyCode(String email, String code) {
        String normalizedEmail = normalize(email);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new AuthException(AuthErrorCode.ACCOUNT_ALREADY_EXISTS);
        }

        boolean isValid = otpService.verifyOtp(
                OtpPurpose.VERIFY_EMAIL,
                normalizedEmail,
                code);

        if (!isValid) {
            throw new AuthException(AuthErrorCode.INVALID_VERIFICATION_CODE);
        }

        user.setStatus(UserStatus.ACTIVE);

        log.info("Account verified successfully for user: {}", normalizedEmail);
    }

    @Transactional
    public void verifyCodeForForgotPassword(String email, String code) {
        String normalizedEmail = normalize(email);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AuthException(AuthErrorCode.USER_NOT_FOUND);
        }

        boolean isValid = otpService.verifyOtp(
                OtpPurpose.FORGOT_PASSWORD,
                normalizedEmail,
                code);

        if (!isValid) {
            throw new AuthException(AuthErrorCode.INVALID_VERIFICATION_CODE);
        }

        log.info("[AUTH] Forgot password OTP verified successfully for user: {}", normalizedEmail);    }

    /*
        Resend otp to mail user
     */
    @Transactional(readOnly = true)
    public void resendCode(String email) {
        String normalizedEmail = normalize(email);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new AuthException(AuthErrorCode.ACCOUNT_ALREADY_EXISTS);
        }

        generateAndSendOtp(
                OtpPurpose.VERIFY_EMAIL,
                user.getEmail(),
                user.getUsername());
    }

    /*
        Normalize email of user
     */
    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
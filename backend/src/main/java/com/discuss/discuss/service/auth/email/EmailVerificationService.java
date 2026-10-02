package com.discuss.discuss.service.auth.email;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.InvalidVerificationException;
import com.discuss.discuss.exception.auth.OtpCooldownException;
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

    public void generateAndSendCode(String email, String username) {
        String normalizedEmail = normalize(email);

        if (otpService.isInCooldown(normalizedEmail)) {
            throw new OtpCooldownException(
                    "Please wait " + otpService.getCooldownSeconds()
                            + " seconds before requesting a new code");
        }

        String code = otpService.generateOtp(normalizedEmail);
        emailService.sendOtpEmail(normalizedEmail, username, code);

        log.info("OTP generated and sent for user: {}", normalizedEmail);
    }

    @Transactional
    public void verifyCode(String email, String code) {
        String normalizedEmail = normalize(email);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new InvalidVerificationException("Invalid verification code"));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new InvalidVerificationException(
                    "The account has already been verified");
        }

        boolean isValid = otpService.verifyOtp(normalizedEmail, code);

        if (!isValid) {
            throw new InvalidVerificationException(
                    "The verification code is incorrect or has expired");
        }

        user.setStatus(UserStatus.ACTIVE);

        log.info("Account verified successfully for user: {}", normalizedEmail);
    }

    @Transactional(readOnly = true)
    public void resendCode(String email) {
        String normalizedEmail = normalize(email);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() ->
                        new InvalidVerificationException("Email does not exist"));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new InvalidVerificationException(
                    "The account has already been verified");
        }

        generateAndSendCode(user.getEmail(), user.getUsername());
    }

    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
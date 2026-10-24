package com.discuss.discuss.service.auth.email;

import com.discuss.discuss.enums.OtpPurpose;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;



@Service
@RequiredArgsConstructor
public class OtpService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String COOLDOWN_PREFIX = "otp:cooldown:";
    private static final String ATTEMPTS_PREFIX = "otp:attempts:";
    private static final int MAX_ATTEMPTS = 5;

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${app.otp.expiration-minutes}")
    private long expirationMinutes;

    @Value("${app.otp.resend-cooldown-seconds}")
    private long resendCooldownSeconds;

    public String generateOtp(OtpPurpose purpose, String email) {
        String code = String.valueOf(100000 + RANDOM.nextInt(900000));

        redisTemplate.opsForValue().set(
                purpose.getPrefix() + email, code, Duration.ofMinutes(expirationMinutes));
        redisTemplate.opsForValue().set(
                cooldownKey(purpose, email), "1", Duration.ofSeconds(resendCooldownSeconds));
        redisTemplate.delete(attemptsKey(purpose, email));
        return code;
    }

    public boolean verifyOtp(OtpPurpose purpose, String email, String code) {
        String otpKey = purpose.getPrefix() + email;
        String attemptsKey = attemptsKey(purpose, email);

        Long attempts = redisTemplate.opsForValue().increment(attemptsKey);
        if (attempts != null && attempts == 1) {
            redisTemplate.expire(attemptsKey, Duration.ofMinutes(expirationMinutes));
        }
        if (attempts != null && attempts > MAX_ATTEMPTS) {
            redisTemplate.delete(otpKey);
            throw new AuthException(AuthErrorCode.OTP_TOO_MANY_ATTEMPTS);
        }

        String storedCode = redisTemplate.opsForValue().get(otpKey);
        if (storedCode == null || code == null || !constantTimeEquals(storedCode, code)) {
            return false;
        }

        redisTemplate.delete(otpKey);
        redisTemplate.delete(attemptsKey);
        return true;
    }

    public boolean isInCooldown(OtpPurpose purpose, String email) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(cooldownKey(purpose, email)));
    }

    public long getCooldownSeconds() {
        return resendCooldownSeconds;
    }

    private String cooldownKey(OtpPurpose purpose, String email) {
        return COOLDOWN_PREFIX + purpose.name() + ":" + email;
    }

    private String attemptsKey(OtpPurpose purpose, String email) {
        return ATTEMPTS_PREFIX + purpose.name() + ":" + email;
    }

    private boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

}
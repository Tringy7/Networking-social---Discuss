package com.discuss.discuss.service.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${app.otp.expiration-minutes}")
    private long expirationMinutes;

    @Value("${app.otp.resend-cooldown-seconds}")
    private long resendCooldownSeconds;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String OTP_PREFIX = "otp:verify-email:";
    private static final String COOLDOWN_PREFIX = "otp:cooldown:";

    /**
     * Sinh mã OTP mới, lưu vào Redis với TTL, trả về mã để gửi email.
     */
    public String generateOtp(String email) {
        String code = String.valueOf(100000 + RANDOM.nextInt(900000));

        String otpKey = OTP_PREFIX + email;
        redisTemplate.opsForValue().set(otpKey, code, Duration.ofMinutes(expirationMinutes));

        String cooldownKey = COOLDOWN_PREFIX + email;
        redisTemplate.opsForValue().set(cooldownKey, "1", Duration.ofSeconds(resendCooldownSeconds));

        return code;
    }

    /**
     * Kiểm tra mã OTP có đúng không. Nếu đúng, xóa key khỏi Redis (dùng 1 lần).
     */
    public boolean verifyOtp(String email, String code) {
        String otpKey = OTP_PREFIX + email;
        String storedCode = redisTemplate.opsForValue().get(otpKey);

        if (storedCode == null || !storedCode.equals(code)) {
            return false;
        }

        redisTemplate.delete(otpKey); // dùng 1 lần, xóa ngay sau khi verify đúng
        return true;
    }

    /**
     * Kiểm tra user có đang trong thời gian cooldown (chống spam resend) không.
     */
    public boolean isInCooldown(String email) {
        String cooldownKey = COOLDOWN_PREFIX + email;
        return Boolean.TRUE.equals(redisTemplate.hasKey(cooldownKey));
    }

    public long getCooldownSeconds() {
        return resendCooldownSeconds;
    }
}
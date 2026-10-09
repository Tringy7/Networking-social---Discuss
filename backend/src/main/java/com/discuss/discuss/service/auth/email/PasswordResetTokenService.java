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
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class PasswordResetTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final RedisTemplate<String, String> redisTemplate;

    @Value("${app.password-reset.expiration-minutes}")
    private long expirationMinutes;

    /**
     * Tạo token đặt lại mật khẩu.
     * Chỉ gọi sau khi OTP đã được xác minh thành công.
     */
    public String generateToken(String email) {
        byte[] randomBytes = new byte[32];
        RANDOM.nextBytes(randomBytes);

        // Token gốc gửi cho client.
        String rawToken = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        // Chỉ lưu hash của token trong Redis.
        String tokenHash = sha256(rawToken);

        redisTemplate.opsForValue().set(
                redisKey(tokenHash),
                email,
                Duration.ofMinutes(expirationMinutes)
        );

        return rawToken;
    }

    /**
     * Lấy email tương ứng với token.
     * Ném exception nếu token không tồn tại hoặc đã hết hạn.
     */
    public String getEmailByToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new AuthException(AuthErrorCode.INVALID_RESET_TOKEN);
        }

        String tokenHash = sha256(rawToken);

        String email = redisTemplate.opsForValue()
                .get(redisKey(tokenHash));

        if (email == null) {
            throw new AuthException(AuthErrorCode.INVALID_RESET_TOKEN);
        }

        return email;
    }

    /**
     * Xóa token sau khi đặt lại mật khẩu thành công.
     */
    public void consumeToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new AuthException(AuthErrorCode.INVALID_RESET_TOKEN);
        }

        String tokenHash = sha256(rawToken);

        Boolean deleted = redisTemplate.delete(redisKey(tokenHash));

        if (!Boolean.TRUE.equals(deleted)) {
            throw new AuthException(AuthErrorCode.INVALID_RESET_TOKEN);
        }
    }

    private String redisKey(String tokenHash) {
        return OtpPurpose.FORGOT_PASSWORD.getPrefix() + tokenHash;
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    value.getBytes(StandardCharsets.UTF_8)
            );

            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(hash);

        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(
                    "SHA-256 algorithm is not available",
                    e
            );
        }
    }
}

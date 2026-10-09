package com.discuss.discuss.utils;

import com.discuss.discuss.dto.auth.AuthResult;
import com.discuss.discuss.service.auth.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class CookieUtil {

    private final JwtService jwtService;

    @Value("${app.cookie.secure}")
    private boolean secure;

    @Value("${app.cookie.same-site}")
    private String sameSite;

    @Value("${app.password-reset.expiration-minutes}")
    private long expirationMinutes;

    public static final String ACCESS_TOKEN_COOKIE = "access_token";
    public static final String REFRESH_TOKEN_COOKIE = "refresh_token";
    public static final String RESET_PASSWORD_TOKEN_COOKIE =
            "reset_password_token";


    public ResponseCookie buildAccessTokenCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from(ACCESS_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(maxAgeSeconds)
                .build();
    }

    public ResponseCookie buildRefreshTokenCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/auth")
                .maxAge(maxAgeSeconds)
                .build();
    }

    public ResponseCookie buildPasswordResetTokenCookie(String token) {
        return ResponseCookie.from(RESET_PASSWORD_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/auth/reset-password")
                .maxAge(Duration.ofMinutes(expirationMinutes))
                .build();
    }

    public ResponseCookie clearCookie(String name, String path) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path(path)
                .maxAge(0)
                .build();
    }


    public ResponseCookie clearPasswordResetTokenCookie() {
        return ResponseCookie.from("password_reset_token", "")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/auth/reset-password")
                .maxAge(Duration.ZERO)
                .build();
    }

    public HttpHeaders buildAuthHeaders(AuthResult result) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.SET_COOKIE,
                buildAccessTokenCookie(result.getAccessToken(),
                        this.jwtService.getAccessExpirationSeconds()).toString());
        headers.add(HttpHeaders.SET_COOKIE,
                buildRefreshTokenCookie(result.getRefreshToken(),
                        this.jwtService.getRefreshExpirationSeconds()).toString());
        return headers;
    }

    public HttpHeaders buildPasswordResetHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();

        headers.add(
                HttpHeaders.SET_COOKIE,
                buildPasswordResetTokenCookie(token).toString()
        );

        return headers;
    }

}
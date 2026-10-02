package com.discuss.discuss.controller.auth;

import com.discuss.discuss.dto.auth.*;
import com.discuss.discuss.mapper.auth.AuthMapper;
import com.discuss.discuss.service.auth.AuthService;
import com.discuss.discuss.service.auth.JwtService;
import com.discuss.discuss.utils.annotation.auth.CookieUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final CookieUtil cookieUtil;

    public record SocialLoginRequestDTO(@NotBlank String token) {}
    public record ResendOtpRequestDTO(@NotBlank @Email String email) {}

    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDTO> register(@Valid @RequestBody RegisterRequestDTO request) {
        RegisterResponseDTO result = this.authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String, String>> resendOtp(
            @Valid @RequestBody ResendOtpRequestDTO request) {

        this.authService.resendOtp(request.email);

        return ResponseEntity.ok(
                Map.of("message", "Verification code has been sent")
        );
    }

    @PostMapping("/verify-email")
    public ResponseEntity<String> verifyEmail(@Valid @RequestBody VerifyEmailRequestDTO request) {
        AuthResult result = this.authService.verifyEmailAndIssueTokens(request.getEmail(), request.getCode());

        ResponseCookie accessCookie = cookieUtil.buildAccessTokenCookie(
                result.getAccessToken(), jwtService.getAccessExpirationSeconds());
        ResponseCookie refreshCookie = cookieUtil.buildRefreshTokenCookie(
                result.getRefreshToken(), jwtService.getRefreshExpirationSeconds());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body("Email verified successfully");
    }


    @PostMapping("/social/{provider}")
    public ResponseEntity<Map<String, String>> loginWithSocial(
            @PathVariable String provider,
            @RequestBody SocialLoginRequestDTO request) {

        AuthResult result = authService.loginWithProvider(provider, request.token);

        ResponseCookie accessCookie = cookieUtil.buildAccessTokenCookie(
                result.getAccessToken(), jwtService.getAccessExpirationSeconds());
        ResponseCookie refreshCookie = cookieUtil.buildRefreshTokenCookie(
                result.getRefreshToken(), jwtService.getRefreshExpirationSeconds());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(Map.of("message", "Login with " + provider + " successful"));
    }
}
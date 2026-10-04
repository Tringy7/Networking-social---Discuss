package com.discuss.discuss.controller.auth;

import com.discuss.discuss.dto.auth.*;
import com.discuss.discuss.exception.auth.RefreshTokenException;
import com.discuss.discuss.service.auth.JwtService;
import com.discuss.discuss.service.auth.LocalAuthService;
import com.discuss.discuss.service.auth.TokenService;
import com.discuss.discuss.service.auth.social.SocialAuthService;
import com.discuss.discuss.utils.CookieUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final LocalAuthService localAuthService;
    private final SocialAuthService socialAuthService;
    private final TokenService tokenService;
    private final JwtService jwtService;
    private final CookieUtil cookieUtil;
    private final AuthenticationManagerBuilder authenticationManagerBuilder;

    public record SocialLoginRequestDTO(@NotBlank String token) {}
    public record ResendOtpRequestDTO(@NotBlank @Email String email) {}

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterRequestDTO request) {
        AuthResponseDTO result = this.localAuthService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String, String>> resendOtp(
            @Valid @RequestBody ResendOtpRequestDTO request) {

        this.localAuthService.resendOtp(request.email);

        return ResponseEntity.ok(
                Map.of("message", "Verification code has been sent")
        );
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@Valid @RequestBody VerifyEmailRequestDTO request) {
        AuthResult result = this.localAuthService.verifyEmailAndIssueTokens(request.getEmail(), request.getCode());

        ResponseCookie accessCookie = cookieUtil.buildAccessTokenCookie(
                result.getAccessToken(), jwtService.getAccessExpirationSeconds());
        ResponseCookie refreshCookie = cookieUtil.buildRefreshTokenCookie(
                result.getRefreshToken(), jwtService.getRefreshExpirationSeconds());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(Map.of("message", "Email verified successfully"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(@CookieValue(
            name = "refresh_token", defaultValue = "") String refreshToken) throws Exception {
        if (refreshToken.equals("")) {
            throw new RefreshTokenException("Not refreshed token");
        }

        AuthResult result = this.tokenService.refreshToken(refreshToken);
        ResponseCookie accessCookie = cookieUtil.buildAccessTokenCookie(
                result.getAccessToken(), jwtService.getAccessExpirationSeconds());
        ResponseCookie refreshCookie = cookieUtil.buildRefreshTokenCookie(
                result.getRefreshToken(), jwtService.getRefreshExpirationSeconds());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(Map.of("message", "Token refreshed successfully"));
    }


    @PostMapping("/social/{provider}")
    public ResponseEntity<Map<String, String>> loginWithSocial(
            @PathVariable String provider,
            @RequestBody SocialLoginRequestDTO request) {

        AuthResult result = this.socialAuthService.loginWithProvider(provider, request.token);

        ResponseCookie accessCookie = cookieUtil.buildAccessTokenCookie(
                result.getAccessToken(), jwtService.getAccessExpirationSeconds());
        ResponseCookie refreshCookie = cookieUtil.buildRefreshTokenCookie(
                result.getRefreshToken(), jwtService.getRefreshExpirationSeconds());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(Map.of("message", "Login with " + provider + " successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO loginRequestDTO) throws Exception {
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                loginRequestDTO.getUsername(),
                loginRequestDTO.getPassword());
        Authentication authentication = this.authenticationManagerBuilder.getObject().authenticate(authenticationToken);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String username = authentication.getName();
//
//         loginRes = this.authService.handleAuthentication(email);
//
//        return ResponseEntity.ok()
//                .header(HttpHeaders.SET_COOKIE, this.authService.getCookie(loginRes.getRefreshToken()).toString())
//                .body(loginRes);
        return null;
    }
}
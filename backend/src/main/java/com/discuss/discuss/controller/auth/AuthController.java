package com.discuss.discuss.controller.auth;

import com.discuss.discuss.dto.auth.*;
import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.mapper.auth.AuthMapper;
import com.discuss.discuss.service.auth.LocalAuthService;
import com.discuss.discuss.service.auth.TokenService;
import com.discuss.discuss.service.auth.social.SocialAuthService;
import com.discuss.discuss.utils.CookieUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthMapper authMapper;
    private final LocalAuthService localAuthService;
    private final SocialAuthService socialAuthService;
    private final TokenService tokenService;
    private final CookieUtil cookieUtil;

    public record SocialLoginRequestDTO(@NotBlank String token) {}
    public record ResendOtpRequestDTO(@NotBlank @Email String email) {}
    public record RequestEmailDTO(@NotBlank @Email String email) {}

    public record ChangePasswordOtpDTO(
            @NotBlank @Pattern(regexp = "\\d{6}") String code) {}

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterRequestDTO request) {
        AuthResponseDTO result = localAuthService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequestDTO request) {
        localAuthService.verifyEmailAndIssueTokens(request.getEmail(), request.getCode());
        return ResponseEntity.ok().body(new ApiResponse("Email verified successfully"));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse> resendOtp(@Valid @RequestBody ResendOtpRequestDTO request) {
        localAuthService.resendOtp(request.email());
        return ResponseEntity.ok(new ApiResponse("Verification code has been sent"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse> refresh(
            @CookieValue(name = CookieUtil.REFRESH_TOKEN_COOKIE, defaultValue = "") String refreshToken) {
        if (refreshToken.isBlank()) {
            throw new AuthException(AuthErrorCode.INVALID_REFRESH_TOKEN);
        }
        AuthResult result = tokenService.refreshToken(refreshToken);
        return ResponseEntity.ok()
                .headers(cookieUtil.buildAuthHeaders(result))
                .body(new ApiResponse("Token refreshed successfully"));
    }

    @PostMapping("/social/{provider}")
    public ResponseEntity<AuthResponseDTO> loginWithSocial(
            @PathVariable String provider,
            @Valid @RequestBody SocialLoginRequestDTO request) {
        AuthResult result = socialAuthService.loginWithProvider(provider, request.token());
        return ResponseEntity.ok()
                .headers(cookieUtil.buildAuthHeaders(result))
                .body(authMapper.toResponse(result.getUser(), "Login with " + provider + " successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody LoginRequestDTO loginRequestDTO) {
        AuthResult result = localAuthService.login(loginRequestDTO);
        return ResponseEntity.ok()
                .headers(cookieUtil.buildAuthHeaders(result))
                .body(authMapper.toResponse(result.getUser(), "Login successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody RequestEmailDTO request) {
        String message = this.localAuthService.forgotPassword(request.email);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse(message));
    }

    @PostMapping("/forgot-password/verify")
    public ResponseEntity<ApiResponse> verifyForgotPassword(
            @Valid @RequestBody VerifyEmailRequestDTO request) {

        String resetToken = localAuthService.verifyForgotPassword(
                request.getEmail(),
                request.getCode()
        );

        return ResponseEntity.ok()
                .headers(cookieUtil.buildPasswordResetHeaders(resetToken))
                .body(new ApiResponse(
                        "Email verification successful. You can now reset your password."
                ));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse> resetPassword(
            @CookieValue(
                    name = CookieUtil.RESET_PASSWORD_TOKEN_COOKIE,
                    defaultValue = ""
            ) String resetPasswordToken,
            @Valid @RequestBody ForgotPasswordDTO request
    ) {
        localAuthService.resetPassword(
                resetPasswordToken,
                request.getPassword()
        );

        ResponseCookie resetPasswordCookie = cookieUtil.clearCookie(
                CookieUtil.RESET_PASSWORD_TOKEN_COOKIE,
                "/auth/forgot-password/reset"
        );

        return ResponseEntity.ok()
                .headers(cookieUtil.buildClearedAuthHeaders())
                .header(
                        HttpHeaders.SET_COOKIE,
                        resetPasswordCookie.toString()
                )
                .body(new ApiResponse(
                        "Password has been reset successfully"
                ));
    }

    @PostMapping("/change-password/request")
    public ResponseEntity<ApiResponse> requestChangePassword() {
        localAuthService.requestChangePasswordOtp();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookieUtil.clearCookie(
                        CookieUtil.CHANGE_PASSWORD_TOKEN_COOKIE, "/auth/change-password").toString())
                .body(new ApiResponse("Mã OTP đã được gửi đến email tài khoản của bạn."));
    }

    @PostMapping("/change-password/verify")
    public ResponseEntity<ApiResponse> verifyChangePassword(@Valid @RequestBody ChangePasswordOtpDTO request) {
        String token = localAuthService.verifyChangePasswordOtp(request.code());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookieUtil.buildChangePasswordTokenCookie(token).toString())
                .body(new ApiResponse("Xác thực OTP thành công."));
    }

    @PatchMapping("/change-password")
    public ResponseEntity<ApiResponse> changePassword(
            @CookieValue(name = CookieUtil.CHANGE_PASSWORD_TOKEN_COOKIE, defaultValue = "") String token,
            @Valid @RequestBody ForgotPasswordDTO request) {
        localAuthService.changePassword(token, request.getPassword());
        return ResponseEntity.ok()
                .headers(cookieUtil.buildClearedAuthHeaders())
                .header(HttpHeaders.SET_COOKIE, cookieUtil.clearCookie(
                        CookieUtil.CHANGE_PASSWORD_TOKEN_COOKIE, "/auth/change-password").toString())
                .body(new ApiResponse("Đổi mật khẩu thành công."));
    }

    @GetMapping("/sessions")
    public List<AuthSessionResponse> sessions() {
        return tokenService.listSessions();
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<ApiResponse> revokeSession(@PathVariable String id) {
        boolean current = tokenService.revokeSession(id);
        return ResponseEntity.ok()
                .headers(current ? cookieUtil.buildClearedAuthHeaders() : new HttpHeaders())
                .body(new ApiResponse("Session revoked successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(
            @CookieValue(name = CookieUtil.REFRESH_TOKEN_COOKIE, defaultValue = "") String refreshToken) {
        tokenService.revokeRefreshToken(refreshToken);

        ResponseCookie accessCookie =
                cookieUtil.clearCookie(CookieUtil.ACCESS_TOKEN_COOKIE, "/");

        ResponseCookie refreshCookie =
                cookieUtil.clearCookie(CookieUtil.REFRESH_TOKEN_COOKIE, "/auth");

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(new ApiResponse("Logout successfully"));
    }
}
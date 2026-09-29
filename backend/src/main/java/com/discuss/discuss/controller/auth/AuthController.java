package com.discuss.discuss.controller.auth;

import com.discuss.discuss.dto.auth.AuthResult;
import com.discuss.discuss.dto.auth.RegisterRequestDTO;
import com.discuss.discuss.dto.auth.RegisterResponseDTO;
import com.discuss.discuss.mapper.auth.AuthMapper;
import com.discuss.discuss.service.auth.AuthService;
import com.discuss.discuss.service.auth.JwtService;
import com.discuss.discuss.utils.annotation.auth.CookieUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthMapper authMapper;
    private final JwtService jwtService;
    private final CookieUtil cookieUtil;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponseDTO> register(@Valid @RequestBody RegisterRequestDTO request) {

        AuthResult result = authService.register(request);
        RegisterResponseDTO body = authMapper.toRegisterResponse(result);

        ResponseCookie accessCookie = cookieUtil.buildAccessTokenCookie(
                result.getAccessToken(), jwtService.getAccessExpirationSeconds());
        ResponseCookie refreshCookie = cookieUtil.buildRefreshTokenCookie(
                result.getRefreshToken(), jwtService.getRefreshExpirationSeconds());

        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(body);
    }
}
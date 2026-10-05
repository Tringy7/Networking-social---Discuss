package com.discuss.discuss.service.auth;

import com.discuss.discuss.dto.auth.AuthResult;
import com.discuss.discuss.entity.RefreshToken;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.repository.RefreshTokenRepository;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final JwtService jwtService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    public AuthResult issueTokens(User user) {
        String accessToken = jwtService.createAccessToken(
                user.getUsername(),
                user
        );

        String rawRefreshToken = jwtService.createRefreshToken(
                user.getUsername(),
                user
        );

        String hashedRefreshToken = jwtService.hashToken(rawRefreshToken);

        userService.saveRefreshToken(
                user,
                hashedRefreshToken,
                jwtService.getRefreshTokenExpiration()
        );

        return new AuthResult(accessToken, rawRefreshToken);
    }

    @Transactional
    public AuthResult refreshToken(String rawToken) {

        if (rawToken == null || rawToken.isBlank()) {
            throw new AuthException(
                    AuthErrorCode.REFRESH_TOKEN_MISSING
            );
        }

        Jwt decodedToken;

        try {
            decodedToken = jwtService.verifyRefreshToken(rawToken);
        } catch (Exception e) {
            throw new AuthException(
                    AuthErrorCode.INVALID_REFRESH_TOKEN
            );
        }

        String username = decodedToken.getSubject();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND)
                );

        String tokenHash = jwtService.hashToken(rawToken);

        RefreshToken storedToken = refreshTokenRepository
                .findByToken(tokenHash)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.INVALID_REFRESH_TOKEN)
                );

        if (Boolean.TRUE.equals(storedToken.getRevoked())) {

            revokeAllUserTokens(user);

            throw new AuthException(AuthErrorCode.REFRESH_TOKEN_REUSED);
        }

        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {

            throw new AuthException(AuthErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        storedToken.setRevoked(true);

        return issueTokens(user);
    }

    @Transactional
    public void revokeAllUserTokens(User user) {

        List<RefreshToken> activeTokens =
                refreshTokenRepository
                        .findByUser_IdAndRevokedFalse(user.getId());

        activeTokens.forEach(token ->
                token.setRevoked(true)
        );
    }
}
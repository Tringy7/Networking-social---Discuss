package com.discuss.discuss.service.auth;

import com.discuss.discuss.dto.auth.AuthResult;
import com.discuss.discuss.entity.RefreshToken;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.exception.auth.InvalidRefreshTokenException;
import com.discuss.discuss.exception.auth.UserNotFoundException;
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
        String accessToken = jwtService.createAccessToken(user.getUsername(), user);
        String rawRefreshToken = jwtService.createRefreshToken(user.getUsername(), user);
        String hashedRefreshToken = jwtService.hashToken(rawRefreshToken);

        userService.saveRefreshToken(user, hashedRefreshToken, jwtService.getRefreshTokenExpiration());

        return new AuthResult(accessToken, rawRefreshToken);
    }

    @Transactional
    public AuthResult refreshToken(String rawToken) {
        Jwt decodedToken = jwtService.verifyRefreshToken(rawToken);
        String username = decodedToken.getSubject();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        String tokenHash = jwtService.hashToken(rawToken);
        RefreshToken storedToken = refreshTokenRepository.findByToken(tokenHash)
                .orElseThrow(() -> new InvalidRefreshTokenException("Refresh token not recognized"));

        if (Boolean.TRUE.equals(storedToken.getRevoked())) {
            revokeAllUserTokens(user);
            throw new InvalidRefreshTokenException(
                    "Refresh token reuse detected. All sessions have been revoked for security.");
        }

        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidRefreshTokenException("Refresh token has expired");
        }

        storedToken.setRevoked(true);

        return issueTokens(user);
    }

    public void revokeAllUserTokens(User user) {
        List<RefreshToken> activeTokens = refreshTokenRepository.findByUser_IdAndRevokedFalse(user.getId());
        activeTokens.forEach(t -> t.setRevoked(true));
    }
}
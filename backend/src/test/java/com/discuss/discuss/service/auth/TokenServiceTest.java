package com.discuss.discuss.service.auth;

import com.discuss.discuss.entity.AuthSession;
import com.discuss.discuss.entity.RefreshToken;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.repository.AuthSessionRepository;
import com.discuss.discuss.repository.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenServiceTest {

    @Mock JwtService jwtService;
    @Mock AuthSessionRepository sessions;
    @Mock RefreshTokenRepository refreshTokens;

    @InjectMocks TokenService tokens;

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = " ")
    void rejectsMissingRefreshTokenBeforeLookingUpSession(String rawToken) {
        assertThatExceptionOfType(AuthException.class)
                .isThrownBy(() -> tokens.refreshToken(rawToken))
                .extracting(AuthException::getError).isEqualTo(AuthErrorCode.REFRESH_TOKEN_MISSING);
        verifyNoInteractions(jwtService, sessions, refreshTokens);
    }

    @Test
    void rejectsRevokedSessionBeforeLookingUpRefreshToken() {
        AuthSession session = activeSession();
        session.setRevoked(true);

        assertThatExceptionOfType(AuthException.class)
                .isThrownBy(() -> tokens.refreshToken("raw-token"))
                .extracting(AuthException::getError).isEqualTo(AuthErrorCode.INVALID_REFRESH_TOKEN);
        verifyNoInteractions(refreshTokens);
    }

    @Test
    void rejectsExpiredStoredTokenWithoutRotatingIt() {
        AuthSession session = activeSession();
        RefreshToken token = RefreshToken.builder().session(session).user(session.getUser())
                .expiresAt(LocalDateTime.now().minusHours(1)).revoked(false).build();
        when(jwtService.hashToken("raw-token")).thenReturn("token-hash");
        when(refreshTokens.findByTokenForUpdate("token-hash")).thenReturn(Optional.of(token));

        assertThatExceptionOfType(AuthException.class)
                .isThrownBy(() -> tokens.refreshToken("raw-token"))
                .extracting(AuthException::getError).isEqualTo(AuthErrorCode.REFRESH_TOKEN_EXPIRED);
        verify(refreshTokens, never()).save(any());
    }

    private AuthSession activeSession() {
        User user = User.builder().id(1L).username("tri").status(UserStatus.ACTIVE).build();
        AuthSession session = AuthSession.builder().id("device-1").user(user)
                .expiresAt(Instant.now().plusSeconds(3600)).build();
        Jwt decoded = Jwt.withTokenValue("raw-token").header("alg", "HS256")
                .subject(user.getUsername()).claim("sid", session.getId()).build();
        when(jwtService.verifyRefreshToken("raw-token")).thenReturn(decoded);
        when(sessions.findForUpdate(session.getId())).thenReturn(Optional.of(session));
        return session;
    }
}

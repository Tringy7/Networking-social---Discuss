package com.discuss.discuss.service.auth;

import com.discuss.discuss.dto.auth.*;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.*;
import com.discuss.discuss.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.*;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class TokenService {
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthSessionRepository sessions;

    @Transactional
    public AuthResult issueTokens(User user) {
        Instant now = Instant.now();
        AuthSession session = sessions.save(
                AuthSession.builder()
                        .id(UUID.randomUUID().toString())
                        .user(user)
                        .deviceName(deviceName())
                        .createdAt(now)
                        .lastActiveAt(now)
                        .expiresAt(jwtService.getRefreshTokenExpiration())
                        .revoked(false).build());
        return this.issueForSession(user, session);
    }

    private AuthResult issueForSession(User user, AuthSession session) {
        String access = jwtService.createAccessToken(user.getUsername(), user, session.getId());
        String refresh = jwtService.createRefreshToken(user.getUsername(), user, session.getId());
        session.setLastActiveAt(Instant.now());
        session.setExpiresAt(jwtService.getRefreshTokenExpiration());
        refreshTokenRepository.save(RefreshToken.builder().user(user).session(session)
                .token(jwtService.hashToken(refresh)).revoked(false)
                .expiresAt(LocalDateTime.ofInstant(session.getExpiresAt(), ZoneId.systemDefault())).build());
        return new AuthResult(user, access, refresh);
    }

    @Transactional(noRollbackFor = RefreshTokenReusedException.class)
    public AuthResult refreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new AuthException(AuthErrorCode.REFRESH_TOKEN_MISSING);
        }

        Jwt decoded;
        try {
            decoded = jwtService.verifyRefreshToken(rawToken);
        } catch (Exception ex) {
            throw new AuthException(AuthErrorCode.INVALID_REFRESH_TOKEN);
        }

        Object sid = decoded.getClaims().get("sid");
        if (!(sid instanceof String id)) {
            throw new AuthException(AuthErrorCode.INVALID_REFRESH_TOKEN);
        }

        // Serialize all rotation/revocation operations for this device, including older tokens.
        AuthSession session = sessions.findForUpdate(id)
                .orElseThrow(() -> new AuthException(AuthErrorCode.INVALID_REFRESH_TOKEN));

        User user = session.getUser();
        if (session.isRevoked()
                || !session.getExpiresAt().isAfter(Instant.now())
                || user.getStatus() != UserStatus.ACTIVE
                || !user.getUsername().equals(decoded.getSubject())) {
            throw new AuthException(AuthErrorCode.INVALID_REFRESH_TOKEN);
        }

        RefreshToken token = refreshTokenRepository.findByTokenForUpdate(jwtService.hashToken(rawToken))
                .orElseThrow(() -> new AuthException(AuthErrorCode.INVALID_REFRESH_TOKEN));

        if (token.getSession() == null
                || !id.equals(token.getSession().getId())
                || !user.getId().equals(token.getUser().getId())) {
            throw new AuthException(AuthErrorCode.INVALID_REFRESH_TOKEN);
        }

        if (Boolean.TRUE.equals(token.getRevoked())) {
            session.setRevoked(true);
            revokeSessionTokens(id);
            throw new RefreshTokenReusedException();
        }

        if (!token.getExpiresAt().isAfter(LocalDateTime.now())) {
            throw new AuthException(AuthErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        token.setRevoked(true);
        return issueForSession(user, session);
    }

    @Transactional
    public void revokeRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return;
        // Accept an expired cookie for logout. The secret hash identifies its session.
        refreshTokenRepository.findByToken(jwtService.hashToken(rawToken)).ifPresent(token -> {
            if (token.getSession() != null) sessions.findForUpdate(token.getSession().getId()).ifPresent(session -> {
                session.setRevoked(true);
                revokeSessionTokens(session.getId());
            });
            else refreshTokenRepository.revokeByTokenHash(jwtService.hashToken(rawToken));
        });
    }

    @Transactional
    public void revokeAllUserTokens(User user) {
        sessions.revokeAllForUser(user.getId());
        refreshTokenRepository.findByUser_IdAndRevokedFalse(user.getId()).forEach(t -> t.setRevoked(true));
    }

    private void revokeSessionTokens(String id) { refreshTokenRepository.revokeBySessionId(id); }

    @Transactional(readOnly = true)
    public List<AuthSessionResponse> listSessions() {
        Jwt current = currentJwt();
        User user = userRepository.findByUsername(current.getSubject())
                .orElseThrow(() -> new AuthException(AuthErrorCode.USER_NOT_FOUND));
        return sessions.findByUser_IdAndRevokedFalseAndExpiresAtAfterOrderByLastActiveAtDesc(user.getId(), Instant.now())
                .stream().map(s -> new AuthSessionResponse(s.getId(), s.getDeviceName(), s.getCreatedAt(),
                        s.getLastActiveAt(), s.getExpiresAt(), s.getId().equals(current.getClaimAsString("sid")))).toList();
    }

    @Transactional
    public boolean revokeSession(String id) {
        Jwt current = currentJwt();
        AuthSession session = sessions.findForUpdate(id)
                .filter(s -> s.getUser().getUsername().equals(current.getSubject()))
                .orElseThrow(() -> new AuthException(AuthErrorCode.SESSION_NOT_FOUND));
        session.setRevoked(true);
        revokeSessionTokens(id);
        return id.equals(current.getClaimAsString("sid"));
    }

    private Jwt currentJwt() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) throw new AuthException(AuthErrorCode.INVALID_CREDENTIALS);
        return jwt;
    }

    private String deviceName() {
        var attributes = RequestContextHolder.getRequestAttributes();
        String ua = attributes instanceof ServletRequestAttributes servlet
                ? servlet.getRequest().getHeader("User-Agent") : null;
        if (ua == null || ua.isBlank()) return "  No device";
        String browser = ua.contains("Edg/") || ua.contains("EdgA/") ? "Edge"
                : ua.contains("OPR/") ? "Opera" : ua.contains("Firefox/") || ua.contains("FxiOS/") ? "Firefox"
                : ua.contains("Chrome/") || ua.contains("CriOS/") ? "Chrome" : ua.contains("Safari/") ? "Safari" : "Trình duyệt khác";
        String os = ua.contains("iPad") ? "iPad" : ua.contains("iPhone") ? "iPhone" : ua.contains("Android") ? "Android"
                : ua.contains("Windows") ? "Windows" : ua.contains("Macintosh") ? "macOS" : ua.contains("Linux") ? "Linux" : "thiết bị khác";
        return browser + " trên " + os;
    }
}

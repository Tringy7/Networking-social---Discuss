package com.discuss.discuss.service.auth;

import com.discuss.discuss.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
public class JwtService {

    public static final MacAlgorithm JWT_ALGORITHM = MacAlgorithm.HS256;

    @Value("${jwt.expiration.access.token}")
    private long jwtExpirationAccessTokenMs;

    @Value("${jwt.expiration.refresh.token}")
    private long jwtExpirationRefreshTokenMs;

    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final SecretKey secretKey;

    public JwtService(JwtEncoder jwtEncoder, SecretKey secretKey, JwtDecoder jwtDecoder) {
        this.jwtEncoder = jwtEncoder;
        this.secretKey = secretKey;
        this.jwtDecoder = jwtDecoder;
    }

    public long getAccessExpirationSeconds() {
        return jwtExpirationAccessTokenMs / 1000;
    }

    public long getRefreshExpirationSeconds() {
        return jwtExpirationRefreshTokenMs / 1000;
    }

    public String createAccessToken(String userName, User user) {
        Instant now = Instant.now();
        Instant validity = now.plus(jwtExpirationAccessTokenMs, ChronoUnit.MILLIS);
        return createToken(userName, user, now, validity);
    }

    public String createRefreshToken(String userName, User user) {
        Instant now = Instant.now();
        Instant validity = now.plus(jwtExpirationRefreshTokenMs, ChronoUnit.MILLIS);
        return createToken(userName, user, now, validity);
    }

    public Instant getRefreshTokenExpiration() {
        return Instant.now()
                .plus(jwtExpirationRefreshTokenMs, ChronoUnit.MILLIS);
    }

    private String createToken(String userName, User user, Instant now, Instant validity) {
        List<String> authorities = List.of(user.getRole().name());

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuedAt(now)
                .expiresAt(validity)
                .subject(userName)
                .claim("authorities", authorities)
                .build();

        JwsHeader jwsHeader = JwsHeader.with(JWT_ALGORITHM).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims)).getTokenValue();
    }

    public static Optional<String> getCurrentUserJWT() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        return Optional.ofNullable(securityContext.getAuthentication())
                .filter(authentication -> authentication.getCredentials() instanceof String)
                .map(authentication -> (String) authentication.getCredentials());
    }

    public static Optional<String> getCurrentUserLogin() {
        SecurityContext securityContext = SecurityContextHolder.getContext();
        return Optional.ofNullable(extractPrincipal(securityContext.getAuthentication()));
    }

    private static String extractPrincipal(Authentication authentication) {
        if (authentication == null) {
            return null;
        } else if (authentication.getPrincipal() instanceof UserDetails springSecurityUser) {
            return springSecurityUser.getUsername();
        } else if (authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getSubject();
        } else if (authentication.getPrincipal() instanceof String s) {
            return s;
        }
        return null;
    }

    public Jwt verifyRefreshToken(String refreshToken) {
        try {
            return jwtDecoder.decode(refreshToken);
        } catch (JwtException e) {
            log.warn("Refresh token verification failed: {}", e.getMessage());
            throw e;
        }
    }

    public String hashToken(String token) {
        return DigestUtils.sha256Hex(token);
    }
}
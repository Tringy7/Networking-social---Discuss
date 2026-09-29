package com.discuss.discuss.service.auth;

import com.discuss.discuss.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Component
public class JwtService {

    public static final MacAlgorithm JWT_ALGORITHM = MacAlgorithm.HS256;

    @Value("${jwt.expiration.access.token}")
    private long jwtExpirationAccessTokenMs;

    @Value("${jwt.expiration.refresh.token}")
    private long jwtExpirationRefreshTokenMs;

    private final JwtEncoder jwtEncoder;

    public JwtService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
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
}
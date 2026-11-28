package com.discuss.discuss.service.auth;

import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.repository.AuthSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;

@Component @RequiredArgsConstructor
public class SessionTokenValidator implements OAuth2TokenValidator<Jwt> {
    private final AuthSessionRepository sessions;
    @Override @Transactional(readOnly = true)
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        Object sid = jwt.getClaims().get("sid");
        boolean active = sid instanceof String id && sessions.findById(id)
                .filter(s -> !s.isRevoked() && s.getExpiresAt().isAfter(Instant.now())
                        && s.getUser().getStatus() == UserStatus.ACTIVE
                        && s.getUser().getUsername().equals(jwt.getSubject())).isPresent();
        return active ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Session is no longer active", null));
    }
}

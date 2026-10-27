package com.discuss.discuss.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Cookie;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.oauth2.jwt.JwtValidationException;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {
    private static final String ACCESS_TOKEN_COOKIE = "access_token";

    private final ObjectMapper objectMapper;

    public CustomAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        String code = resolveCode(request, authException);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        objectMapper.writeValue(response.getWriter(),
                Map.of(
                        "status", 401,
                        "code", code,
                        "message", "Not authenticated or the token is invalid"
                ));
    }

    private String resolveCode(HttpServletRequest request, AuthenticationException exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof JwtValidationException validationException
                    && validationException.getErrors().stream()
                    .anyMatch(error -> error.getDescription() != null
                            && error.getDescription().toLowerCase(Locale.ROOT).contains("expired"))) {
                return "ACCESS_TOKEN_EXPIRED";
            }
        }

        if (hasAccessToken(request)) {
            return "ACCESS_TOKEN_INVALID";
        }
        return "ACCESS_TOKEN_MISSING";
    }

    private boolean hasAccessToken(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")) {
            return true;
        }

        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return false;
        }
        for (Cookie cookie : cookies) {
            if (ACCESS_TOKEN_COOKIE.equals(cookie.getName())) {
                return true;
            }
        }
        return false;
    }
}

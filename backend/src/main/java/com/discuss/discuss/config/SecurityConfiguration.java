package com.discuss.discuss.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.util.Base64;
import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Arrays;
import java.util.List;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfiguration {

    private static final String ACCESS_TOKEN_COOKIE = "access_token";

    @Value("${jwt.secret}")
    private String jwtKey;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${app.cookie.secure}")
    private boolean secureCookies;

    @Value("${app.cookie.same-site}")
    private String cookieSameSite;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            CustomAuthenticationEntryPoint customAuthenticationEntryPoint,
            CustomAccessDeniedHandler customAccessDeniedHandler,
            JwtDecoder jwtDecoder,
            JwtAuthenticationConverter jwtAuthenticationConverter,
            BearerTokenResolver bearerTokenResolver) throws Exception {

        String[] PUBLIC_ENDPOINTS = {
                "/auth/**"
        };

        CookieCsrfTokenRepository csrfTokenRepository =
                CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfTokenRepository.setCookiePath("/");
        csrfTokenRepository.setCookieCustomizer(cookie ->
                cookie.secure(secureCookies).sameSite(cookieSameSite));

        http
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfTokenRepository)
                        .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(
                        authz -> authz
                                .requestMatchers("/auth/change-password").authenticated()
                                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                                .requestMatchers("/users/by-username/**", "/users/search").permitAll()
                                .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .decoder(jwtDecoder)
                                .jwtAuthenticationConverter(jwtAuthenticationConverter))
                        .bearerTokenResolver(bearerTokenResolver)
                        .authenticationEntryPoint(customAuthenticationEntryPoint))
                .exceptionHandling(
                        exceptions -> exceptions
                                .authenticationEntryPoint(customAuthenticationEntryPoint) // 401
                                .accessDeniedHandler(customAccessDeniedHandler) // 403
                )
                .formLogin(f -> f.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList());
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept",
                "Origin", "X-XSRF-TOKEN", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration
                .setExposedHeaders(Arrays.asList("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Đọc JWT từ cookie "access_token" thay vì header Authorization.
     * Nếu không tìm thấy cookie, fallback về header Authorization (hữu ích cho
     * Postman/testing/mobile app).
     */
    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        return request -> {
            String path = request.getServletPath();
            if (path.equals("/auth/login")
                    || path.equals("/auth/register")
                    || path.equals("/auth/verify-email")
                    || path.equals("/auth/resend-otp")
                    || path.equals("/auth/refresh")
                    || path.equals("/auth/logout")
                    || path.equals("/auth/csrf")
                    || path.startsWith("/auth/social/")
                    || path.startsWith("/auth/forgot-password")) {
                return null;
            }

            if (request.getCookies() != null) {
                String tokenFromCookie = Arrays.stream(request.getCookies())
                        .filter(c -> ACCESS_TOKEN_COOKIE.equals(c.getName()))
                        .map(Cookie::getValue)
                        .findFirst()
                        .orElse(null);
                if (tokenFromCookie != null) {
                    return tokenFromCookie;
                }
            }

            // Fallback: header Authorization: Bearer <token>
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                return header.substring(7);
            }

            return null;
        };
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");
        grantedAuthoritiesConverter.setAuthoritiesClaimName("authorities");

        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }

    @Bean
    public SecretKey jwtSecretKey() {
        byte[] keyBytes = Base64.from(jwtKey).decode();
        return new SecretKeySpec(keyBytes, MacAlgorithm.HS256.getName());
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSecretKey));
    }

    @Bean
    public JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
        return NimbusJwtDecoder.withSecretKey(jwtSecretKey).build();
    }
}
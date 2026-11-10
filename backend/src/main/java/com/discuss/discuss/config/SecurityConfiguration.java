package com.discuss.discuss.config;

import com.discuss.discuss.service.auth.JwtService;
import com.discuss.discuss.service.auth.SessionTokenValidator;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.util.Base64;
import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;

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

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            CustomAuthenticationEntryPoint customAuthenticationEntryPoint,
            CustomAccessDeniedHandler customAccessDeniedHandler,
            @Qualifier("jwtDecoder") JwtDecoder jwtDecoder,
            JwtAuthenticationConverter jwtAuthenticationConverter,
            BearerTokenResolver bearerTokenResolver) throws Exception {

        String[] PUBLIC_ENDPOINTS = {
            "/auth/**",
            "/explore",
            "/explore/**"
        };

        http
                .csrf(c -> c.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(
                        authz -> authz
                                .requestMatchers("/admin/**").hasRole("ADMIN")
                                .requestMatchers("/auth/sessions", "/auth/sessions/**").authenticated()
                                .requestMatchers("/auth/change-password", "/auth/change-password/**").authenticated()
                                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
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
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173", "http://localhost:5173/"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept",
                "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration
                .setExposedHeaders(Arrays.asList("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Đọc JWT từ cookie "access_token" thay vì header Authorization. Nếu không
     * tìm thấy cookie, fallback về header Authorization (hữu ích cho
     * Postman/testing/mobile app).
     */
    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        return request -> {
            // Logout identifies the session by its refresh cookie, even if access is expired/invalid.
            if ("POST".equals(request.getMethod()) && "/auth/logout".equals(request.getServletPath())) {
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
    public JwtDecoder jwtDecoder(SecretKey jwtSecretKey, SessionTokenValidator sessions) {
        return decoderForTokenType(jwtSecretKey, JwtService.ACCESS_TOKEN_TYPE, sessions);
    }

    @Bean
    public JwtDecoder refreshJwtDecoder(SecretKey jwtSecretKey) {
        return decoderForTokenType(jwtSecretKey, JwtService.REFRESH_TOKEN_TYPE, jwt -> OAuth2TokenValidatorResult.success());
    }

    private JwtDecoder decoderForTokenType(SecretKey secretKey, String expectedType,
                                          OAuth2TokenValidator<Jwt> sessionValidator) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(secretKey)
                .macAlgorithm(JwtService.JWT_ALGORITHM)
                .build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefault(),
                new JwtClaimValidator<String>(JwtService.TOKEN_TYPE_CLAIM, expectedType::equals),
                sessionValidator));
        return decoder;
    }
}

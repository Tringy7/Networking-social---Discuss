package com.discuss.discuss.controller.auth;

import com.discuss.discuss.config.CustomAccessDeniedHandler;
import com.discuss.discuss.config.CustomAuthenticationEntryPoint;
import com.discuss.discuss.config.SecurityConfiguration;
import com.discuss.discuss.dto.auth.SocialUserInfo;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.OtpPurpose;
import com.discuss.discuss.enums.Provider;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.GlobalExceptionHandler;
import com.discuss.discuss.mapper.auth.AuthMapper;
import com.discuss.discuss.repository.AuthSessionRepository;
import com.discuss.discuss.repository.RefreshTokenRepository;
import com.discuss.discuss.repository.UserPrivacySettingsRepository;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.auth.JwtService;
import com.discuss.discuss.service.auth.LocalAuthService;
import com.discuss.discuss.service.auth.SessionTokenValidator;
import com.discuss.discuss.service.auth.TokenService;
import com.discuss.discuss.service.auth.UserDetails;
import com.discuss.discuss.service.auth.email.EmailService;
import com.discuss.discuss.service.auth.email.EmailVerificationService;
import com.discuss.discuss.service.auth.email.OtpService;
import com.discuss.discuss.service.auth.email.PasswordResetTokenService;
import com.discuss.discuss.service.auth.social.SocialAuthProvider;
import com.discuss.discuss.service.auth.social.SocialAuthProviderFactory;
import com.discuss.discuss.service.auth.social.SocialAuthService;
import com.discuss.discuss.service.user.UserPrivacyService;
import com.discuss.discuss.service.user.UserProfileService;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.service.user.UserSpecifications;
import com.discuss.discuss.utils.CookieUtil;
import jakarta.persistence.EntityManagerFactory;
import jakarta.servlet.http.Cookie;
import org.hibernate.boot.model.naming.PhysicalNamingStrategySnakeCaseImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.junit.jupiter.web.SpringJUnitWebConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import tools.jackson.databind.json.JsonMapper;

import javax.sql.DataSource;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import static com.discuss.discuss.utils.CookieUtil.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringJUnitWebConfig(AuthApiIntegrationTest.Config.class)
@TestPropertySource(properties = {
        "jwt.secret=dGVzdC1vbmx5LXNpZ25pbmcta2V5LWZvci1hdXRoLW1vY2ttdmM=",
        "jwt.expiration.access.token=3600000",
        "jwt.expiration.refresh.token=604800000",
        "app.cookie.secure=true",
        "app.cookie.same-site=Strict",
        "app.password-reset.expiration-minutes=10"
})
class AuthApiIntegrationTest {

    private static final String USERNAME = "tri";
    private static final String EMAIL = "tri@example.com";
    private static final String PASSWORD = "test-password-123";
    private static final String NEW_PASSWORD = "new-password-456";
    private static final String OTP = "123456";

    @Autowired WebApplicationContext context;
    @Autowired UserRepository users;
    @Autowired UserPrivacySettingsRepository privacy;
    @Autowired AuthSessionRepository sessions;
    @Autowired RefreshTokenRepository refreshTokens;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;
    @Autowired SocialAuthProvider google;

    @MockitoBean OtpService otpService;
    @MockitoBean EmailService emailService;
    @MockitoBean UserProfileService profiles;
    @MockitoBean RedisTemplate<String, String> redis;
    @MockitoBean ValueOperations<String, String> redisValues;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        refreshTokens.deleteAllInBatch();
        sessions.deleteAllInBatch();
        privacy.deleteAllInBatch();
        users.deleteAllInBatch();
        mvc = webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void registersResendsOtpVerifiesEmailAndLogsIn() throws Exception {
        when(otpService.generateOtp(OtpPurpose.VERIFY_EMAIL, EMAIL)).thenReturn(OTP);
        when(otpService.verifyOtp(OtpPurpose.VERIFY_EMAIL, EMAIL, OTP)).thenReturn(true);
        String registration = """
                {"username":"tri","email":"TRI@example.com","password":"%s","confirmPassword":"%s"}
                """.formatted(PASSWORD, PASSWORD);

        mvc.perform(json(post("/auth/register"), registration))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email").value(EMAIL))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.password").doesNotExist());

        User pending = users.findByEmail(EMAIL).orElseThrow();
        assertThat(passwordEncoder.matches(PASSWORD, pending.getPassword())).isTrue();
        assertThat(pending.getPassword()).isNotEqualTo(PASSWORD);

        mvc.perform(json(post("/auth/resend-otp"), """
                {"email":"tri@example.com"}
                """)).andExpect(status().isOk());
        verify(emailService, times(2)).sendOtpEmail(OtpPurpose.VERIFY_EMAIL, EMAIL, USERNAME, OTP);

        mvc.perform(json(post("/auth/verify-email"), otpBody("654321")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_VERIFICATION_CODE"));
        assertThat(users.findById(pending.getId()).orElseThrow().getStatus()).isEqualTo(UserStatus.PENDING);

        mvc.perform(json(post("/auth/verify-email"), otpBody(OTP)))
                .andExpect(status().isOk());
        User active = users.findById(pending.getId()).orElseThrow();
        assertThat(active.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(privacy.findByUser(active)).isPresent();

        loginAs(USERNAME, PASSWORD);
        assertThat(sessions.count()).isOne();
    }

    @Test
    void rejectsInvalidRegistrationBeforeCreatingAccountOrSendingOtp() throws Exception {
        mvc.perform(json(post("/auth/register"), """
                {"username":"tri!","email":"invalid","password":"short","confirmPassword":"different"}
                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.username").exists())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());

        assertThat(users.count()).isZero();
        verifyNoInteractions(otpService, emailService);
    }

    @ParameterizedTest
    @CsvSource({"ACTIVE, wrong-password, 401, INVALID_CREDENTIALS",
            "PENDING, test-password-123, 403, ACCOUNT_NOT_VERIFIED",
            "LOCKED, test-password-123, 403, ACCOUNT_LOCKED"})
    void rejectsLoginWithoutIssuingSession(UserStatus accountStatus, String password, int httpStatus, String code)
            throws Exception {
        createLocalUser(USERNAME, EMAIL, accountStatus);

        mvc.perform(loginRequest(USERNAME, password))
                .andExpect(status().is(httpStatus))
                .andExpect(jsonPath("$.code").value(code))
                .andExpect(header().doesNotExist("Set-Cookie"));

        assertThat(sessions.count()).isZero();
    }

    @Test
    void rotatesRefreshTokenAndRevokesOnlyItsSessionOnReuse() throws Exception {
        createLocalUser(USERNAME, EMAIL, UserStatus.ACTIVE);
        SessionCookies first = loginAs(USERNAME, PASSWORD);
        SessionCookies other = loginAs(USERNAME, PASSWORD);

        SessionCookies rotated = authCookies(post("/auth/refresh").cookie(first.refresh()));
        assertThat(rotated.refresh().getValue()).isNotEqualTo(first.refresh().getValue());
        assertThat(refreshTokens.findByToken(jwtService.hashToken(first.refresh().getValue())).orElseThrow()
                .getRevoked()).isTrue();

        mvc.perform(post("/auth/refresh").cookie(first.refresh()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("REFRESH_TOKEN_REUSED"));
        mvc.perform(post("/auth/refresh").cookie(rotated.refresh()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_REFRESH_TOKEN"));
        mvc.perform(get("/auth/sessions").cookie(rotated.access()))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/auth/sessions").cookie(other.access()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void rejectsMissingRefreshTokenAndAnAccessTokenInItsPlace() throws Exception {
        createLocalUser(USERNAME, EMAIL, UserStatus.ACTIVE);
        SessionCookies cookies = loginAs(USERNAME, PASSWORD);

        mvc.perform(post("/auth/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_REFRESH_TOKEN"));
        mvc.perform(post("/auth/refresh")
                        .cookie(new Cookie(REFRESH_TOKEN_COOKIE, cookies.access().getValue())))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_REFRESH_TOKEN"));
    }

    @Test
    void logoutClearsCookiesAndRevokesSession() throws Exception {
        createLocalUser(USERNAME, EMAIL, UserStatus.ACTIVE);
        SessionCookies cookies = loginAs(USERNAME, PASSWORD);

        mvc.perform(post("/auth/logout").servletPath("/auth/logout")
                        .cookie(new Cookie(ACCESS_TOKEN_COOKIE, "expired-access"), cookies.refresh()))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge(ACCESS_TOKEN_COOKIE, 0))
                .andExpect(cookie().path(REFRESH_TOKEN_COOKIE, "/auth"))
                .andExpect(cookie().maxAge(REFRESH_TOKEN_COOKIE, 0));
        mvc.perform(get("/auth/sessions").cookie(cookies.access()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void requiresAuthenticationAndRejectsRevokingAnotherUsersSession() throws Exception {
        createLocalUser(USERNAME, EMAIL, UserStatus.ACTIVE);
        createLocalUser("other", "other@example.com", UserStatus.ACTIVE);
        SessionCookies first = loginAs(USERNAME, PASSWORD);
        SessionCookies other = loginAs("other", PASSWORD);
        String firstId = jwtService.verifyRefreshToken(first.refresh().getValue()).getClaimAsString("sid");

        mvc.perform(get("/auth/sessions")).andExpect(status().isUnauthorized());
        mvc.perform(get("/auth/sessions").cookie(first.access()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(firstId))
                .andExpect(jsonPath("$[0].current").value(true));
        mvc.perform(delete("/auth/sessions/{id}", firstId).cookie(other.access()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("SESSION_NOT_FOUND"));
        mvc.perform(delete("/auth/sessions/{id}", firstId).cookie(first.access()))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge(ACCESS_TOKEN_COOKIE, 0))
                .andExpect(cookie().maxAge(REFRESH_TOKEN_COOKIE, 0));
        assertThat(sessions.findById(firstId).orElseThrow().isRevoked()).isTrue();
    }

    @Test
    void resetsPasswordWithSingleUseCookieAndRevokesPreviousSessions() throws Exception {
        createLocalUser(USERNAME, EMAIL, UserStatus.ACTIVE);
        SessionCookies session = loginAs(USERNAME, PASSWORD);
        useInMemoryResetTokenStorage();
        when(otpService.generateOtp(OtpPurpose.FORGOT_PASSWORD, EMAIL)).thenReturn(OTP);
        when(otpService.verifyOtp(OtpPurpose.FORGOT_PASSWORD, EMAIL, OTP)).thenReturn(true);

        mvc.perform(json(post("/auth/forgot-password"), """
                {"email":"tri@example.com"}
                """)).andExpect(status().isCreated());
        verify(emailService).sendOtpEmail(OtpPurpose.FORGOT_PASSWORD, EMAIL, USERNAME, OTP);

        Cookie reset = mvc.perform(json(post("/auth/forgot-password/verify"), otpBody(OTP)))
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly(RESET_PASSWORD_TOKEN_COOKIE, true))
                .andExpect(cookie().path(RESET_PASSWORD_TOKEN_COOKIE, "/auth/forgot-password/reset"))
                .andReturn().getResponse().getCookie(RESET_PASSWORD_TOKEN_COOKIE);

        mvc.perform(json(post("/auth/forgot-password/reset").cookie(reset), passwordBody(NEW_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge(RESET_PASSWORD_TOKEN_COOKIE, 0))
                .andExpect(cookie().maxAge(REFRESH_TOKEN_COOKIE, 0));
        mvc.perform(json(post("/auth/forgot-password/reset").cookie(reset), passwordBody(PASSWORD)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_RESET_TOKEN"));

        assertPasswordUpdated(session);
    }

    @Test
    void changesPasswordAfterAuthenticatedOtpVerification() throws Exception {
        createLocalUser(USERNAME, EMAIL, UserStatus.ACTIVE);
        SessionCookies session = loginAs(USERNAME, PASSWORD);
        useInMemoryResetTokenStorage();
        when(otpService.generateOtp(OtpPurpose.CHANGE_PASSWORD, EMAIL)).thenReturn(OTP);
        when(otpService.verifyOtp(OtpPurpose.CHANGE_PASSWORD, EMAIL, OTP)).thenReturn(true);

        mvc.perform(post("/auth/change-password/request")).andExpect(status().isUnauthorized());
        mvc.perform(post("/auth/change-password/request").cookie(session.access()))
                .andExpect(status().isOk());
        verify(emailService).sendOtpEmail(OtpPurpose.CHANGE_PASSWORD, EMAIL, USERNAME, OTP);

        Cookie change = mvc.perform(json(post("/auth/change-password/verify").cookie(session.access()), """
                        {"code":"123456"}
                        """))
                .andExpect(status().isOk())
                .andExpect(cookie().path(CHANGE_PASSWORD_TOKEN_COOKIE, "/auth/change-password"))
                .andReturn().getResponse().getCookie(CHANGE_PASSWORD_TOKEN_COOKIE);

        mvc.perform(json(patch("/auth/change-password").cookie(session.access(), change), passwordBody(NEW_PASSWORD)))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge(CHANGE_PASSWORD_TOKEN_COOKIE, 0))
                .andExpect(cookie().maxAge(ACCESS_TOKEN_COOKIE, 0));

        assertPasswordUpdated(session);
    }

    @Test
    void signsInWithGoogleAndRejectsUnknownProvider() throws Exception {
        when(google.verifyToken("test-id-token")).thenReturn(SocialUserInfo.builder()
                .email("Google@example.com").name("Google User").emailVerified(true).build());

        String socialBody = """
                {"token":"test-id-token"}
                """;
        mvc.perform(json(post("/auth/social/unknown"), socialBody))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("UNSUPPORTED_PROVIDER"));
        mvc.perform(json(post("/auth/social/google"), socialBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("google@example.com"))
                .andExpect(cookie().httpOnly(ACCESS_TOKEN_COOKIE, true))
                .andExpect(cookie().httpOnly(REFRESH_TOKEN_COOKIE, true));

        User user = users.findByEmail("google@example.com").orElseThrow();
        assertThat(user.getProvider()).isEqualTo(Provider.GOOGLE);
        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(user.getPassword()).isNull();
    }

    private void assertPasswordUpdated(SessionCookies previousSession) throws Exception {
        mvc.perform(get("/auth/sessions").cookie(previousSession.access())).andExpect(status().isUnauthorized());
        mvc.perform(loginRequest(USERNAME, PASSWORD)).andExpect(status().isUnauthorized());
        loginAs(USERNAME, NEW_PASSWORD);
    }

    private void useInMemoryResetTokenStorage() {
        Map<String, String> storedTokens = new HashMap<>();
        when(redis.opsForValue()).thenReturn(redisValues);
        doAnswer(call -> {
            storedTokens.put(call.getArgument(0), call.getArgument(1));
            return null;
        }).when(redisValues).set(anyString(), anyString(), any(Duration.class));
        when(redisValues.get(anyString())).thenAnswer(call -> storedTokens.get(call.getArgument(0)));
        when(redis.delete(anyString())).thenAnswer(call -> storedTokens.remove(call.getArgument(0)) != null);
    }

    private void createLocalUser(String username, String email, UserStatus status) {
        users.save(User.builder().username(username).email(email).status(status).role(UserRole.USER)
                .password(passwordEncoder.encode(PASSWORD)).build());
    }

    private SessionCookies loginAs(String username, String password) throws Exception {
        return authCookies(loginRequest(username, password));
    }

    private SessionCookies authCookies(MockHttpServletRequestBuilder request) throws Exception {
        var response = mvc.perform(request)
                .andExpect(status().isOk())
                .andExpect(cookie().httpOnly(ACCESS_TOKEN_COOKIE, true))
                .andExpect(cookie().secure(ACCESS_TOKEN_COOKIE, true))
                .andExpect(cookie().sameSite(ACCESS_TOKEN_COOKIE, "Strict"))
                .andExpect(cookie().path(ACCESS_TOKEN_COOKIE, "/"))
                .andExpect(cookie().httpOnly(REFRESH_TOKEN_COOKIE, true))
                .andExpect(cookie().secure(REFRESH_TOKEN_COOKIE, true))
                .andExpect(cookie().path(REFRESH_TOKEN_COOKIE, "/auth"))
                .andReturn().getResponse();
        return new SessionCookies(response.getCookie(ACCESS_TOKEN_COOKIE), response.getCookie(REFRESH_TOKEN_COOKIE));
    }

    private static MockHttpServletRequestBuilder loginRequest(String username, String password) {
        return json(post("/auth/login"), """
                {"username":"%s","password":"%s"}
                """.formatted(username, password));
    }

    private static String otpBody(String code) {
        return """
                {"email":"%s","code":"%s"}
                """.formatted(EMAIL, code);
    }

    private static String passwordBody(String password) {
        return """
                {"password":"%s","confirmPassword":"%s"}
                """.formatted(password, password);
    }

    private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
        return request.contentType(APPLICATION_JSON).content(body);
    }

    private record SessionCookies(Cookie access, Cookie refresh) {}

    @Configuration(proxyBeanMethods = false)
    @EnableWebMvc
    @EnableWebSecurity
    @EnableTransactionManagement(proxyTargetClass = true)
    @EnableJpaRepositories(basePackageClasses = UserRepository.class, includeFilters =
            @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = {
                    UserRepository.class, UserPrivacySettingsRepository.class,
                    AuthSessionRepository.class, RefreshTokenRepository.class
            }))
    @Import({AuthController.class, SecurityConfiguration.class, CustomAuthenticationEntryPoint.class,
            CustomAccessDeniedHandler.class, GlobalExceptionHandler.class, AuthMapper.class, CookieUtil.class,
            LocalAuthService.class, TokenService.class, JwtService.class, SessionTokenValidator.class,
            SocialAuthService.class, SocialAuthProviderFactory.class, UserDetails.class,
            EmailVerificationService.class, PasswordResetTokenService.class,
            UserService.class, UserSpecifications.class, UserPrivacyService.class})
    static class Config {

        @Bean
        DataSource dataSource() {
            return new DriverManagerDataSource("jdbc:h2:mem:auth-api;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        }

        @Bean
        LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
            var factory = new LocalContainerEntityManagerFactoryBean();
            factory.setDataSource(dataSource);
            factory.setPackagesToScan(User.class.getPackageName());
            factory.setJpaVendorAdapter(new HibernateJpaVendorAdapter());
            factory.setJpaPropertyMap(Map.of("hibernate.hbm2ddl.auto", "create-drop",
                    "hibernate.physical_naming_strategy", PhysicalNamingStrategySnakeCaseImpl.class.getName(),
                    "hibernate.hbm2ddl.halt_on_error", true));
            return factory;
        }

        @Bean
        JpaTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
            return new JpaTransactionManager(entityManagerFactory);
        }

        @Bean
        JsonMapper objectMapper() {
            return JsonMapper.builder().build();
        }

        @Bean
        SocialAuthProvider google() {
            SocialAuthProvider provider = mock(SocialAuthProvider.class);
            when(provider.getProviderName()).thenReturn("google");
            return provider;
        }
    }
}

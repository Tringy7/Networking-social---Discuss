package com.discuss.discuss.service.auth;

import com.discuss.discuss.dto.auth.AuthResult;
import com.discuss.discuss.dto.auth.LoginRequestDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.Provider;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.auth.email.PasswordResetTokenService;
import com.discuss.discuss.service.user.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LocalAuthServiceTest {

    @Mock UserRepository users;
    @Mock AuthenticationManagerBuilder authenticationManagerBuilder;
    @Mock AuthenticationManager authenticationManager;
    @Mock TokenService tokens;
    @Mock UserService userService;
    @Mock PasswordResetTokenService passwordResetTokens;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks LocalAuthService auth;

    @AfterEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void issuesTokensForActiveAccount() {
        User user = user(UserStatus.ACTIVE);
        authenticateAs(user);
        AuthResult result = new AuthResult(user, "access", "refresh");
        when(tokens.issueTokens(user)).thenReturn(result);

        assertThat(auth.login(credentials())).isSameAs(result);
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("tri");
    }

    @ParameterizedTest
    @CsvSource({
            "PENDING, ACCOUNT_NOT_VERIFIED",
            "LOCKED, ACCOUNT_LOCKED",
            "DELETED, INVALID_CREDENTIALS"
    })
    void rejectsInactiveAccounts(UserStatus status, AuthErrorCode code) {
        authenticateAs(user(status));

        assertThatExceptionOfType(AuthException.class)
                .isThrownBy(() -> auth.login(credentials()))
                .extracting(AuthException::getError).isEqualTo(code);
        verifyNoInteractions(tokens);
    }

    @Test
    void mapsBadCredentialsAndDoesNotIssueTokens() {
        when(authenticationManagerBuilder.getObject()).thenReturn(authenticationManager);
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad password"));

        assertThatExceptionOfType(AuthException.class)
                .isThrownBy(() -> auth.login(credentials()))
                .extracting(AuthException::getError).isEqualTo(AuthErrorCode.INVALID_CREDENTIALS);
        verifyNoInteractions(users, tokens);
    }

    @Test
    void rejectsPasswordResetForGoogleAccount() {
        User user = user(UserStatus.ACTIVE);
        user.setProvider(Provider.GOOGLE);
        when(users.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        assertThatExceptionOfType(AuthException.class)
                .isThrownBy(() -> auth.forgotPassword(" TRI@EXAMPLE.COM "))
                .extracting(AuthException::getError).isEqualTo(AuthErrorCode.PASSWORD_RESET_NOT_SUPPORTED);
        verifyNoInteractions(passwordResetTokens, tokens);
    }

    @Test
    void doesNotConsumeResetTokenWhenPasswordIsUnchanged() {
        User user = user(UserStatus.ACTIVE);
        when(passwordResetTokens.getEmailByToken("reset-token")).thenReturn(user.getEmail());
        when(users.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("unchanged", user.getPassword())).thenReturn(true);

        assertThatExceptionOfType(AuthException.class)
                .isThrownBy(() -> auth.resetPassword("reset-token", "unchanged"))
                .extracting(AuthException::getError).isEqualTo(AuthErrorCode.PASSWORD_UNCHANGED);
        verify(passwordResetTokens, never()).consumeToken(any());
        verify(users, never()).save(any());
        verifyNoInteractions(tokens);
    }

    @Test
    void requiresChangePasswordTokenBoundToCurrentUserAndPurpose() {
        User user = user(UserStatus.ACTIVE);
        when(userService.getCurrentUser()).thenReturn(user);
        when(passwordResetTokens.getEmailByToken("recovery-token")).thenReturn(user.getEmail());

        assertThatExceptionOfType(AuthException.class)
                .isThrownBy(() -> auth.changePassword("recovery-token", "new-password"))
                .extracting(AuthException::getError).isEqualTo(AuthErrorCode.INVALID_RESET_TOKEN);
        verify(passwordResetTokens, never()).consumeToken(any());
        verifyNoInteractions(passwordEncoder, users, tokens);
    }

    private void authenticateAs(User user) {
        when(authenticationManagerBuilder.getObject()).thenReturn(authenticationManager);
        when(authenticationManager.authenticate(any())).thenReturn(
                UsernamePasswordAuthenticationToken.authenticated(user.getUsername(), null, List.of()));
        when(users.findByUsername(user.getUsername())).thenReturn(Optional.of(user));
    }

    private static LoginRequestDTO credentials() {
        LoginRequestDTO request = new LoginRequestDTO();
        request.setUsername("tri");
        request.setPassword("test-password");
        return request;
    }

    private static User user(UserStatus status) {
        return User.builder().id(1L).username("tri").email("tri@example.com")
                .password("encoded-password").status(status).build();
    }
}

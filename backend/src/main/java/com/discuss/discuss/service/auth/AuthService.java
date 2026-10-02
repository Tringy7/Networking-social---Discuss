package com.discuss.discuss.service.auth;

import com.discuss.discuss.dto.auth.AuthResult;
import com.discuss.discuss.dto.auth.RegisterRequestDTO;
import com.discuss.discuss.dto.auth.RegisterResponseDTO;
import com.discuss.discuss.dto.auth.SocialUserInfo;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.Provider;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.EmailAlreadyExistsException;
import com.discuss.discuss.exception.auth.UserNotFoundException;
import com.discuss.discuss.exception.auth.UsernameAlreadyExistsException;
import com.discuss.discuss.exception.auth.VerificationException;
import com.discuss.discuss.mapper.auth.AuthMapper;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.auth.email.EmailVerificationService;
import com.discuss.discuss.service.auth.social.SocialAuthProvider;
import com.discuss.discuss.service.auth.social.SocialAuthProviderFactory;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailVerificationService emailVerificationService;
    private final AuthMapper authMapper;
    private final UserService userService;
    private final SocialAuthProviderFactory socialAuthProviderFactory;

    @Transactional
    public RegisterResponseDTO register(RegisterRequestDTO request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        Optional<User> existingUserOpt = userRepository.findByEmail(normalizedEmail);

        User user;

        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();

            if (existingUser.getStatus() == UserStatus.ACTIVE) {
                throw new EmailAlreadyExistsException(normalizedEmail);
            }

            existingUser.setUsername(resolveUsername(request.getUsername(), existingUser));
            existingUser.setPassword(passwordEncoder.encode(request.getPassword()));

            user = existingUser;

        } else {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new UsernameAlreadyExistsException(request.getUsername());
            }

            user = User.builder()
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(request.getPassword()))
                    .username(request.getUsername())
                    .role(UserRole.USER)
                    .status(UserStatus.PENDING)
                    .build();

            userRepository.save(user);
        }

        emailVerificationService.generateAndSendCode(user.getEmail(), user.getUsername());

        return authMapper.toRegisterResponseFromUser(user);
    }

    private String resolveUsername(String requestedUsername, User existingUser) {
        if (requestedUsername.equals(existingUser.getUsername())) {
            return requestedUsername;
        }
        if (userRepository.existsByUsername(requestedUsername)) {
            throw new UsernameAlreadyExistsException(requestedUsername);
        }
        return requestedUsername;
    }

    public void resendOtp(String email) {
        emailVerificationService.resendCode(email);
    }

    @Transactional
    public AuthResult verifyEmailAndIssueTokens(String email, String code) {
        String normalizedEmail = normalize(email);

        emailVerificationService.verifyCode(normalizedEmail, code);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UserNotFoundException("User not exist"));

        String accessToken = jwtService.createAccessToken(user.getUsername(), user);
        String refreshToken = jwtService.createRefreshToken(user.getUsername(), user);

        this.userService.createUserProfile(user);
        this.userService.saveRefreshToken(
                user,
                refreshToken,
                this.jwtService.getRefreshTokenExpiration());

        return new AuthResult(accessToken, refreshToken);
    }

    @Transactional
    public AuthResult loginWithProvider(String providerName, String token) {
        SocialAuthProvider provider = this.socialAuthProviderFactory.getProvider(providerName);
        SocialUserInfo socialUser = provider.verifyToken(token);

        if (!socialUser.isEmailVerified()) {
            throw new VerificationException("Email not verified by " + providerName);
        }

        String normalizedEmail = socialUser.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseGet(() -> createSocialUser(normalizedEmail, socialUser.getName(), providerName));

        String accessToken = jwtService.createAccessToken(user.getUsername(), user);
        String refreshToken = jwtService.createRefreshToken(user.getUsername(), user);
        userService.saveRefreshToken(user, refreshToken, jwtService.getRefreshTokenExpiration());

        return new AuthResult(accessToken, refreshToken);
    }

    private User createSocialUser(String email, String name, String providerName) {
        User newUser = User.builder()
                .email(email)
                .username(name)
                .password(null)
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .provider(Provider.valueOf(providerName.toUpperCase()))
                .build();
        User savedUser = userRepository.save(newUser);
        userService.createUserProfile(savedUser);
        return savedUser;
    }

    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
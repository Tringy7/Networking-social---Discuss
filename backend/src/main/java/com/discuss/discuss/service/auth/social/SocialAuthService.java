package com.discuss.discuss.service.auth.social;

import com.discuss.discuss.dto.auth.AuthResult;
import com.discuss.discuss.dto.auth.SocialUserInfo;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.Provider;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.auth.TokenService;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SocialAuthService {

    private final SocialAuthProviderFactory socialAuthProviderFactory;
    private final UserRepository userRepository;
    private final UserService userService;
    private final TokenService tokenService;

    @Transactional
    public AuthResult loginWithProvider(String providerName, String token) {
        SocialAuthProvider provider = socialAuthProviderFactory.getProvider(providerName);
        SocialUserInfo socialUser = provider.verifyToken(token);

        if (!socialUser.isEmailVerified()) {
            throw new AuthException(AuthErrorCode.UNSUPPORTED_PROVIDER,"Email not verified by " + providerName);
        }

        String normalizedEmail = socialUser.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseGet(() -> createSocialUser(normalizedEmail, socialUser.getName(), providerName));

        // Handle with user has status "PENDING"
        if (user.getStatus().equals(UserStatus.PENDING)) {
            user = this.handleUserHasStatusPending(user, socialUser.getName());
        }

        return tokenService.issueTokens(user);
    }

    @Transactional
    public User handleUserHasStatusPending(User user, String displayName) {
        user.setPassword(null);
        user.setStatus(UserStatus.ACTIVE);
        user.setProvider(Provider.GOOGLE);

        userRepository.save(user);
        userService.createUserProfileForProvider(user, displayName);
        return user;
    }

    private User createSocialUser(String email, String displayName, String providerName) {
        User newUser = User.builder()
                .email(email)
                .username(email)
                .password(null)
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .provider(Provider.valueOf(providerName.toUpperCase()))
                .build();

        User savedUser = userRepository.save(newUser);
        userService.createUserProfileForProvider(savedUser, displayName);
        return savedUser;
    }
}
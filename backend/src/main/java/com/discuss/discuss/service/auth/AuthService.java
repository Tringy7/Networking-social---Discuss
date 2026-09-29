package com.discuss.discuss.service.auth;

import com.discuss.discuss.dto.auth.AuthResult;
import com.discuss.discuss.dto.auth.RegisterRequestDTO;
import com.discuss.discuss.dto.auth.RegisterResponseDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.EmailAlreadyExistsException;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.utils.annotation.auth.CookieUtil;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CookieUtil cookieUtil;

    @Transactional
    public AuthResult register(RegisterRequestDTO request) {
        if (userRepository.existsByUsername(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .username(request.getUsername())
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.save(user);

        String accessToken = this.jwtService.createAccessToken(user.getUsername(), user);
        String  refreshToken = this.jwtService.createRefreshToken(user.getUsername(), user);
        return new AuthResult(user, accessToken, refreshToken);
    }
}

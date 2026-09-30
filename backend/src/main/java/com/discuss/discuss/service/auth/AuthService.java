package com.discuss.discuss.service.auth;

import com.discuss.discuss.dto.auth.AuthResult;
import com.discuss.discuss.dto.auth.RegisterRequestDTO;
import com.discuss.discuss.dto.auth.RegisterResponseDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.auth.EmailAlreadyExistsException;
import com.discuss.discuss.exception.auth.UserNotExistException;
import com.discuss.discuss.mapper.auth.AuthMapper;
import com.discuss.discuss.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailVerificationService emailVerificationService;
    private final AuthMapper authMapper;

    @Transactional
    public RegisterResponseDTO register(RegisterRequestDTO request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException(normalizedEmail);
        }

        User user = User.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .username(request.getUsername())
                .role(UserRole.USER)
                .status(UserStatus.PENDING)
                .build();

        userRepository.save(user);

        emailVerificationService.generateAndSendCode(user.getEmail(), user.getUsername());

        return authMapper.toRegisterResponseFromUser(user);
    }

    @Transactional
    public AuthResult verifyEmailAndIssueTokens(String email, String code) {
        String normalizedEmail = normalize(email);

        emailVerificationService.verifyCode(normalizedEmail, code);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UserNotExistException("User not exist"));

        String accessToken = jwtService.createAccessToken(user.getUsername(), user);
        String refreshToken = jwtService.createRefreshToken(user.getUsername(), user);

        return new AuthResult(accessToken, refreshToken);
    }

    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
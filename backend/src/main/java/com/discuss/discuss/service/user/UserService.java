package com.discuss.discuss.service.user;

import com.discuss.discuss.dto.auth.AuthResponseDTO;
import com.discuss.discuss.entity.RefreshToken;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserProfile;
<<<<<<< Updated upstream
=======
import com.discuss.discuss.exception.user.UserErrorCode;
import com.discuss.discuss.exception.user.UserException;
import com.discuss.discuss.mapper.user.UserMapper;
>>>>>>> Stashed changes
import com.discuss.discuss.repository.RefreshTokenRepository;
import com.discuss.discuss.repository.UserProfileRepository;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.auth.JwtService;
import com.discuss.discuss.service.auth.TokenService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@AllArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    private final UserMapper userMapper;

    @Transactional
    public void createUserProfile(User user) {
        UserProfile profile = UserProfile.builder()
                .user(user)
                .displayName(user.getUsername())
                .build();

        this.userProfileRepository.save(profile);
    }

    @Transactional
    public void createUserProfileForProvider(User user, String displayName) {
        UserProfile profile = UserProfile.builder()
                .user(user)
                .displayName(displayName)
                .build();

        this.userProfileRepository.save(profile);
    }

}

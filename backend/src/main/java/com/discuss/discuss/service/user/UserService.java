package com.discuss.discuss.service.user;

import com.discuss.discuss.dto.auth.AuthResponseDTO;
import com.discuss.discuss.entity.RefreshToken;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserProfile;
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

    @Transactional
    public void createUserProfile(User user) {
        UserProfile profile = UserProfile.builder()
                .user(user)
                .displayName(user.getUsername())
                .build();

        this.userProfileRepository.save(profile);
    }


}

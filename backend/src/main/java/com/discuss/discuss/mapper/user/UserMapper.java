package com.discuss.discuss.mapper.user;

import com.discuss.discuss.dto.user.UserInfoResponseDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserProfile;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserInfoResponseDTO toUserInfoResponse(
            User user,
            UserProfile profile
    ) {

        UserInfoResponseDTO.Profile profileDTO = null;

        if (profile != null) {
            profileDTO = new UserInfoResponseDTO.Profile(
                    profile.getDisplayName(),
                    profile.getAvatar(),
                    profile.getBio()
            );
        }

        return new UserInfoResponseDTO(
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt(),
                profileDTO
        );
    }
}
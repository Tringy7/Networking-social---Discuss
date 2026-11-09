package com.discuss.discuss.mapper.auth;

import com.discuss.discuss.dto.auth.AuthResponseDTO;
import com.discuss.discuss.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    public AuthResponseDTO.UserDTO toUserDTO(User user) {
        return AuthResponseDTO.UserDTO.builder()
                .id(String.valueOf(user.getId()))
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public AuthResponseDTO toResponse(
            User user,
            String message
    ) {
        return AuthResponseDTO.builder()
                .message(message)
                .data(toUserDTO(user))
                .build();
    }
}
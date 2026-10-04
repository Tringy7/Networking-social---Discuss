package com.discuss.discuss.mapper.auth;

import com.discuss.discuss.dto.auth.AuthResponseDTO;
import com.discuss.discuss.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    public AuthResponseDTO.UserDTO toUserDTO(User user) {
        AuthResponseDTO.UserDTO dto = new AuthResponseDTO.UserDTO();

        dto.setId(String.valueOf(user.getId()));
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setCreatedAt(user.getCreatedAt());

        return dto;
    }

    public AuthResponseDTO toRegisterResponse(
            User user,
            String message
    ) {
        return AuthResponseDTO.builder()
                .message(message)
                .data(toUserDTO(user))
                .build();
    }
}
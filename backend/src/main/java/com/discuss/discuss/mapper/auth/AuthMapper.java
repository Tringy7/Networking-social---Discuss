package com.discuss.discuss.mapper.auth;

import com.discuss.discuss.dto.auth.RegisterResponseDTO;
import com.discuss.discuss.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    public RegisterResponseDTO.UserDTO toUserDTO(User user) {
        RegisterResponseDTO.UserDTO dto = new RegisterResponseDTO.UserDTO();

        dto.setId(String.valueOf(user.getId()));
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setCreatedAt(user.getCreatedAt());

        return dto;
    }

    public RegisterResponseDTO toRegisterResponse(
            User user,
            String message
    ) {
        return RegisterResponseDTO.builder()
                .message(message)
                .content(toUserDTO(user))
                .build();
    }
}
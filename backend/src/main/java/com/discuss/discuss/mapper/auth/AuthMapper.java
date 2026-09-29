package com.discuss.discuss.mapper.auth;

import com.discuss.discuss.dto.auth.AuthResult;
import com.discuss.discuss.dto.auth.RegisterResponseDTO;
import com.discuss.discuss.entity.User;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {
    public RegisterResponseDTO toRegisterResponse(AuthResult result) {
        User user = result.getUser();

        return RegisterResponseDTO.builder()
                .id(String.valueOf(user.getId()))
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
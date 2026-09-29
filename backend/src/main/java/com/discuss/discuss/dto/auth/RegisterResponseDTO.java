package com.discuss.discuss.dto.auth;

import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RegisterResponseDTO {
    private String id;
    private String username;
    private String email;
    private UserRole role;
    private UserStatus status;
    private LocalDateTime createdAt;
}

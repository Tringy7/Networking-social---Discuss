package com.discuss.discuss.dto.auth;

import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponseDTO {

    private String message;
    private UserDTO data;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDTO {
        private String id;
        private String username;
        private String email;
        private UserRole role;
        private UserStatus status;
        private LocalDateTime createdAt;
    }
}
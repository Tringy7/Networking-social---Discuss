package com.discuss.discuss.dto.auth;

import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
public class RegisterResponseDTO {
    private String message;
    private UserDTO content;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class UserDTO {
        private String id;
        private String username;
        private String email;
        private UserRole role;
        private UserStatus status;
        private LocalDateTime createdAt;
    }

}

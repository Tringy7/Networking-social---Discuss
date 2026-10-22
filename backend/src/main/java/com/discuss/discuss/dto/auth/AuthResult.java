package com.discuss.discuss.dto.auth;

import com.discuss.discuss.entity.User;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResult {
    private User user;
    private String accessToken;
    private String refreshToken;
}

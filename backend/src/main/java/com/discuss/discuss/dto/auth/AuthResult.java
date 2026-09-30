package com.discuss.discuss.dto.auth;

import com.discuss.discuss.entity.User;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
public class AuthResult {
    private String accessToken;
    private String refreshToken;
}

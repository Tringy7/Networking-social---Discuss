package com.discuss.discuss.dto.auth;

import lombok.Data;

@Data
public class VerifyEmailRequestDTO {
    private String email;
    private String code;
}

package com.discuss.discuss.dto.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SocialUserInfo {
    private String email;
    private String name;
    private boolean emailVerified;
    private String providerUserId;
}
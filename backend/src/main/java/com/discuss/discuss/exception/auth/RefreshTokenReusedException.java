package com.discuss.discuss.exception.auth;

/** Allows the refresh transaction to commit security revocations before returning 401. */
public class RefreshTokenReusedException extends AuthException {
    public RefreshTokenReusedException() {
        super(AuthErrorCode.REFRESH_TOKEN_REUSED);
    }
}

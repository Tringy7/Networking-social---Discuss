package com.discuss.discuss.service.auth.social;

import com.discuss.discuss.dto.auth.SocialUserInfo;

public interface SocialAuthProvider {

    /**
     * Tên định danh provider, dùng để chọn đúng implementation (vd "google", "facebook")
     */
    String getProviderName();

    /**
     * Verify token do client gửi lên, trả về thông tin user chuẩn hóa.
     * Mỗi provider verify khác nhau (Google ID Token, Facebook access token...)
     */
    SocialUserInfo verifyToken(String token);
}
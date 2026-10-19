package com.discuss.discuss.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ImageKind {

    AVATAR("profiles/%s/avatar/", 256, 256, true, true),

    PROFILE_BANNER("profiles/%s/banner/", 1920, 640, false, false),

    COMMUNITY_AVATAR("communities/%s/avatar/", 512, 512, true, false),

    COMMUNITY_BANNER("communities/%s/banner/", 1920, 640, false, false),

    POST("posts/%s/", 1920, 1920, false, false);

    private final String prefixTemplate;
    private final int maxWidth;
    private final int maxHeight;
    private final boolean square;
    private final boolean exactSize;

    public String prefixFor(Object ownerId) {
        return prefixTemplate.formatted(ownerId);
    }
}
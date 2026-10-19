package com.discuss.discuss.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ImageKind {

    AVATAR("profiles/%s/avatar/", 256, 256, true, true),

    PROFILE_BANNER("profiles/%s/banner/", 1500, 500, false, false),

    COMMUNITY_ICON("communities/%s/icon/", 512, 512, true, false),

    COMMUNITY_BANNER("communities/%s/banner/", 1500, 500, false, false),

    POST("posts/%s/", 1600, 1600, false, false);

    private final String prefixTemplate;
    private final int maxWidth;
    private final int maxHeight;
    private final boolean square;
    private final boolean exactSize;

    public String prefixFor(Object ownerId) {
        return prefixTemplate.formatted(ownerId);
    }
}
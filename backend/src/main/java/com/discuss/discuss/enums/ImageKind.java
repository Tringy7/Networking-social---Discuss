package com.discuss.discuss.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ImageKind {

    AVATAR("profiles/%s/avatar/", 256, 256, true, true),

    PROFILE_BANNER("profiles/%s/banner/", 1920, 640, false, false);

    private final String prefixTemplate;
    private final int maxWidth;
    private final int maxHeight;
    private final boolean square;
    private final boolean exactSize;

    public String prefixFor(Object ownerId) {
        return prefixTemplate.formatted(ownerId);
    }
}
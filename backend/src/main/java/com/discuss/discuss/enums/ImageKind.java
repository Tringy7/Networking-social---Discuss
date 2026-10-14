package com.discuss.discuss.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ImageKind {
    AVATAR(256, 256, true, true),
    COMMUNITY_ICON(512, 512, true, false),
    POST(1600, 1600, false, false),
    BANNER(1920, 1080, false, false);

    private final int maxWidth;
    private final int maxHeight;
    private final boolean square;
    private final boolean exactSize;
}
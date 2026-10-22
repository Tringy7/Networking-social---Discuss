package com.discuss.discuss.enums;

public enum ImageType {
    AVATAR("avatars"), POST("posts"), COMMENT("comments");
    final String folder;
    ImageType(String folder) { this.folder = folder; }
}

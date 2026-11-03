package com.discuss.discuss.dto.post;

import com.discuss.discuss.enums.MediaType;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.PostType;
import java.time.LocalDateTime;
import java.util.List;

public record PostResponseDTO(
        String id, String communityName, String communityDisplayName, String communityAvatar,
        Author author, String title, PostType type, String content, List<String> tags,
        List<Media> media, String linkUrl,
        long heartCount, long commentCount, boolean isHearted, boolean isSaved,
        boolean pinned, PostStatus status, LocalDateTime createdAt, LocalDateTime updatedAt
) {
    public record Author(String id, String username, String displayName, String avatarUrl) {}
    public record Media(MediaType type, String objectKey, String caption, String url, int position, boolean inlineImage) {}
}

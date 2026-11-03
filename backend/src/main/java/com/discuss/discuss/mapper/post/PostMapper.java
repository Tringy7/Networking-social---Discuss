package com.discuss.discuss.mapper.post;

import com.discuss.discuss.dto.post.*;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.service.media.MinioService;
import com.discuss.discuss.service.post.PostMarkdown;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.*;

@Component @RequiredArgsConstructor
public class PostMapper {
    private final MinioService minio;

    public PostResponseDTO toResponse(Post post, PostContent content, List<PostMedia> media,
                                      long hearts, long comments, boolean hearted) {
        User user = post.getUser();
        UserProfile profile = user.getProfile();
        Community community = post.getCommunity();
        CommunityInfo info = community.getInfo();
        String markdown = markdown(content);
        Set<String> inline = PostMarkdown.imageKeys(markdown);
        PostType type = post.getType() == null
                ? content.getLinkUrl() == null ? PostType.TEXT : PostType.LINK : post.getType();
        return new PostResponseDTO(post.getId().toString(), community.getName(), community.getName(),
                info == null ? null : minio.buildFileUrl(info.getAvatar()),
                new PostResponseDTO.Author(user.getId().toString(), user.getUsername(),
                        profile == null || profile.getDisplayName() == null ? user.getUsername() : profile.getDisplayName(),
                        profile == null ? null : minio.buildFileUrl(profile.getAvatar())),
                content.getTitle(), type, markdown, List.copyOf(content.getTags()),
                media.stream().map(m -> new PostResponseDTO.Media(m.getMediaType(), m.getObjectKey(), m.getCaption(), imageUrl(m),
                        m.getDisplayOrder() == null ? 0 : m.getDisplayOrder(),
                        m.getObjectKey() != null && inline.contains(m.getObjectKey()))).toList(),
                content.getLinkUrl(), hearts, comments, hearted, false, Boolean.TRUE.equals(post.getIsPinned()),
                post.getStatus(), post.getCreatedAt(), post.getUpdatedAt());
    }

    private String markdown(PostContent content) {
        if (content.getBlocks().isEmpty())
            return PostMarkdown.legacyMarkdown(content.getContent(), content.getCodeLanguage(), content.getCode());
        // Read-only bridge for previously persisted block documents. The first edit stores Markdown.
        List<String> fragments = new ArrayList<>();
        for (PostBlock block : content.getBlocks()) {
            switch (block.getType()) {
                case TEXT -> fragments.add(block.getText());
                case CODE -> fragments.add(PostMarkdown.legacyMarkdown("", block.getLanguage(), block.getCode()).stripLeading());
                case IMAGE -> {
                    if (block.getObjectKey() != null) fragments.add("![Image](post-image:" + block.getObjectKey() + ")");
                }
                case LINK -> fragments.add("<" + block.getUrl().replace(">", "%3E") + ">");
            }
        }
        return String.join("\n\n", fragments);
    }

    private String imageUrl(PostMedia image) {
        return image.getObjectKey() == null ? image.getMediaUrl() : minio.buildFileUrl(image.getObjectKey());
    }
}

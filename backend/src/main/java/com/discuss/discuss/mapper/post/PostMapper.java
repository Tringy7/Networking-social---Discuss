package com.discuss.discuss.mapper.post;

import com.discuss.discuss.dto.post.*;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.service.media.MinioService;
import com.discuss.discuss.service.post.PostMarkdown;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class PostMapper {

    private final MinioService minio;

    public PostResponseDTO toResponse(
            Post post,
            PostContent content,
            List<PostMedia> media,
            long voteScore,
            long comments,
            VoteType userVote
    ) {
        User user = post.getUser();
        UserProfile profile = user.getProfile();

        Community community = post.getCommunity();
        CommunityInfo info = community.getInfo();

        String markdown = content.getContent();
        Set<String> inline = PostMarkdown.imageKeys(markdown);

        PostType type = post.getType() == null
                ? PostType.TEXT
                : post.getType();

        return new PostResponseDTO(
                post.getId().toString(),
                community.getName(),
                community.getName(),
                info == null
                        ? null
                        : minio.buildFileUrl(info.getAvatar()),

                new PostResponseDTO.Author(
                        user.getId().toString(),
                        user.getUsername(),
                        profile == null || profile.getDisplayName() == null
                                ? user.getUsername()
                                : profile.getDisplayName(),
                        profile == null
                                ? null
                                : minio.buildFileUrl(profile.getAvatar())
                ),

                content.getTitle(),
                type,
                markdown,
                List.copyOf(content.getTags()),

                media.stream()
                        .map(m -> new PostResponseDTO.Media(
                                m.getType(),
                                m.getObjectKey(),
                                m.getCaption(),
                                imageUrl(m),
                                m.getDisplayOrder() == null
                                        ? 0
                                        : m.getDisplayOrder(),
                                m.getObjectKey() != null
                                        && inline.contains(m.getObjectKey())
                        ))
                        .toList(),

                null,
                voteScore,
                comments,
                userVote,
                false,
                Boolean.TRUE.equals(post.getIsPinned()),
                post.getStatus(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }

    private String imageUrl(PostMedia image) {
        return minio.buildFileUrl(image.getObjectKey());
    }
}
package com.discuss.discuss.service.post;

import com.discuss.discuss.dto.post.*;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.PostMedia;
import com.discuss.discuss.enums.MediaType;
import com.discuss.discuss.exception.post.PostErrorCode;
import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.repository.PostMediaRepository;
import com.discuss.discuss.service.media.ImageService;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.Map;
import java.util.HashMap;
import java.util.HashSet;
import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Post attachment references and Markdown tokens; ImageService owns image storage. */
@Service
@RequiredArgsConstructor
public class PostMediaService {
    private final PostMediaRepository postMediaRepository;
    private final ImageService imageService;

    public List<PostMedia> findAttachments(Long postId) {
        return postMediaRepository.findByPostIdOrderByDisplayOrderAsc(postId);
    }

    /** Replace references and delete removed objects only after the database commits. */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.MANDATORY)
    public List<PostMedia> replaceAttachments(Post post, CreatePostRequestDTO request, List<PostMedia> previousMedia) {
        Set<String> keptKeys = new HashSet<>(extractImageKeys(request));

        postMediaRepository.deleteByPostId(post.getId());
        postMediaRepository.flush();

        List<PostMedia> result = saveAttachments(post, request);
        previousMedia.stream().map(PostMedia::getObjectKey).filter(key -> !keptKeys.contains(key))
                .forEach(imageService::deletePostImageAfterCommit);
        return result;
    }

    public void validateMedia(CreatePostRequestDTO request, List<MultipartFile> files, Set<String> ownedKeys) {
        this.extractImageKeys(request);

        Set<Integer> indexes = new HashSet<>();

        for (PostMediaDTO item : mediaOf(request)) {
            Integer index = item.getFileIndex();
            if (index == null) {
                if (!ownedKeys.contains(item.getObjectKey())) throw new PostException(PostErrorCode.INVALID_MEDIA);
            } else if (!item.getObjectKey().matches("local/[A-Za-z0-9_-]+")
                    || index < 0 || index >= files.size() || !indexes.add(index)) {
                throw new PostException(PostErrorCode.INVALID_MEDIA);
            }
        }
        if (indexes.size() != files.size()) throw new PostException(PostErrorCode.INVALID_MEDIA);
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.MANDATORY)
    public void storeNewImages(Post post, CreatePostRequestDTO request, List<MultipartFile> files) {
        Map<String, String> replacements = new HashMap<>();

        for (PostMediaDTO item : mediaOf(request)) {
            if (item.getFileIndex() == null) continue;
            var stored = imageService.storePostImage(post.getId(), files.get(item.getFileIndex()));
            replacements.put(item.getObjectKey(), stored.getObjectKey());
            item.setObjectKey(stored.getObjectKey());
            item.setFileIndex(null);
        }
        request.setContent(PostMarkdown.replaceImageKeys(request.getContent(), replacements));
    }

    private List<String> extractImageKeys(CreatePostRequestDTO request) {
        Set<String> imageKeys = new LinkedHashSet<>();

        for (PostMediaDTO mediaItem : mediaOf(request)) {
            if (mediaItem.getType() != MediaType.IMAGE) {
                throw new PostException(PostErrorCode.UNSUPPORTED_MEDIA_TYPE);
            }
            if (!imageKeys.add(mediaItem.getObjectKey())) {
                throw new PostException(PostErrorCode.DUPLICATE_MEDIA);
            }
        }
        if (!imageKeys.containsAll(PostMarkdown.imageKeys(request.getContent()))) {
            throw new PostException(PostErrorCode.MARKDOWN_MEDIA_MISSING);
        }
        return List.copyOf(imageKeys);
    }

    private List<PostMediaDTO> mediaOf(CreatePostRequestDTO request) {
        return request.getMedia() == null ? List.of() : request.getMedia();
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.MANDATORY)
    public List<PostMedia> saveAttachments(Post post, CreatePostRequestDTO request) {
        List<PostMediaDTO> requestedMedia = mediaOf(request);

        List<PostMedia> postAttachments = new ArrayList<>(requestedMedia.size());
        for (int i = 0; i < requestedMedia.size(); i++) {
            PostMediaDTO mediaItem = requestedMedia.get(i);
            if (postMediaRepository.existsByObjectKey(mediaItem.getObjectKey())) {
                throw new PostException(PostErrorCode.DUPLICATE_MEDIA);
            }
            postAttachments.add(PostMedia.builder()
                    .post(post)
                    .objectKey(mediaItem.getObjectKey())
                    .type(mediaItem.getType())
                    .caption(mediaItem.getCaption())
                    .displayOrder(i)
                    .build());
        }
        return postMediaRepository.saveAll(postAttachments);
    }
}

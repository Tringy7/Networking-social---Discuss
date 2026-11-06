package com.discuss.discuss.service.post;

import com.discuss.discuss.dto.post.*;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.PostContent;
import com.discuss.discuss.enums.PostType;
import com.discuss.discuss.exception.post.PostErrorCode;
import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.repository.PostContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Validation and persistence of the editable post document. */
@Service
@RequiredArgsConstructor
public class PostContentService {
    private final PostContentRepository postContentRepository;

    public void validateRequest(CreatePostRequestDTO request) {
        if (request.getType() != PostType.TEXT) {
            throw new PostException(PostErrorCode.UNSUPPORTED_POST_TYPE);
        }

        boolean hasNoContent = request.getContent() == null || request.getContent().isBlank();
        boolean hasNoMedia = request.getMedia() == null || request.getMedia().isEmpty();

        if (hasNoContent && hasNoMedia) {
            throw new PostException(PostErrorCode.EMPTY_POST);
        }
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.MANDATORY)
    public PostContent createContent(Post post, CreatePostRequestDTO request) {
        PostContent postContent = PostContent.builder().post(post).build();
        writeContent(postContent, request);
        postContentRepository.save(postContent);
        return postContent;
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.MANDATORY)
    public void writeContent(PostContent postContent, CreatePostRequestDTO request) {
        postContent.setTitle(request.getTitle().strip());
        postContent.setContent(request.getContent() == null ? "" : request.getContent());
    }
}

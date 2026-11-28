package com.discuss.discuss.service.post;

import com.discuss.discuss.dto.post.CreatePostRequestDTO;
import com.discuss.discuss.dto.post.PostMediaDTO;
import com.discuss.discuss.enums.MediaType;
import com.discuss.discuss.exception.post.PostErrorCode;
import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.repository.PostMediaRepository;
import com.discuss.discuss.service.media.ImageService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.Mockito.mock;

class PostAttachmentServiceTest {
    private final PostAttachmentService attachments =
            new PostAttachmentService(mock(PostMediaRepository.class), mock(ImageService.class));

    @Test
    void acceptsOwnedPhotoReferencesAndTheirMarkdownTokens() {
        attachments.validateMedia(request("![photo](post-image:posts/1/a.png)", image("posts/1/a.png", null)),
                List.of(), Set.of("posts/1/a.png"));
    }

    @Test
    void rejectsAnExistingPhotoFromAnotherPost() {
        assertThatExceptionOfType(PostException.class)
                .isThrownBy(() -> attachments.validateMedia(request("", image("posts/2/a.png", null)),
                        List.of(), Set.of("posts/1/a.png")))
                .extracting(PostException::getError).isEqualTo(PostErrorCode.INVALID_MEDIA);
    }

    @Test
    void rejectsUnmappedMarkdownImageAndDuplicateFileIndex() {
        assertThatExceptionOfType(PostException.class)
                .isThrownBy(() -> attachments.validateMedia(request("post-image:local/missing"), List.of(), Set.of()))
                .extracting(PostException::getError).isEqualTo(PostErrorCode.MARKDOWN_MEDIA_MISSING);

        var file = new MockMultipartFile("files", new byte[]{1});
        assertThatExceptionOfType(PostException.class)
                .isThrownBy(() -> attachments.validateMedia(
                        request("", image("local/first", 0), image("local/second", 0)), List.of(file), Set.of()))
                .extracting(PostException::getError).isEqualTo(PostErrorCode.INVALID_MEDIA);
    }

    private static CreatePostRequestDTO request(String content, PostMediaDTO... media) {
        var request = new CreatePostRequestDTO();
        request.setContent(content);
        request.setMedia(List.of(media));
        return request;
    }

    private static PostMediaDTO image(String key, Integer fileIndex) {
        var image = new PostMediaDTO();
        image.setType(MediaType.IMAGE);
        image.setObjectKey(key);
        image.setFileIndex(fileIndex);
        return image;
    }
}

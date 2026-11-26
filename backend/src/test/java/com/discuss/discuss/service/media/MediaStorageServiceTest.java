package com.discuss.discuss.service.media;

import com.discuss.discuss.enums.ImageKind;
import com.discuss.discuss.exception.media.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class MediaStorageServiceTest {
    private final ImageProcessingService processor = new ImageProcessingService(10485760, 40000000, 0.85f, 0.8f, 1);
    private final MinioService minio = mock(MinioService.class);
    private final MediaStorageService media = new MediaStorageService(processor, minio);

    @Test
    void rejectsVideoWithoutMp4HeaderBeforeUploading() {
        var invalid = new MockMultipartFile("files", "invalid.mp4", "video/mp4", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> media.storePostVideo(1L, invalid, key -> {}))
                .isInstanceOf(MediaException.class)
                .extracting(error -> ((MediaException) error).getError())
                .isEqualTo(MediaErrorCode.INVALID_VIDEO);
        verifyNoInteractions(minio);
    }

    @Test
    void resizesAvatarAndUsesRealImageFormatForObjectKey() throws IOException {
        var image = media.store(ImageKind.AVATAR, 1L, png("photo.jpg", 512, 300));

        assertThat(image.getObjectKey()).startsWith("profiles/1/avatar/").endsWith(".png");
        assertThat(image.getContentType()).isEqualTo("image/png");
        assertThat(image.getWidth()).isEqualTo(256);
        assertThat(image.getHeight()).isEqualTo(256);
        verify(minio).upload(eq(image.getObjectKey()), any(byte[].class), eq("image/png"));
    }

    @Test
    void reservesCommentObjectBeforeUploadAndMarksItPrivate() throws IOException {
        @SuppressWarnings("unchecked")
        Consumer<String> reserve = mock(Consumer.class);

        var image = media.storeCommentImage(7L, png("../photo.png", 32, 16), reserve);

        assertThat(image.getFileName()).isEqualTo("photo.png");
        assertThat(image.getObjectKey()).startsWith("comments/7/");
        var calls = inOrder(reserve, minio);
        calls.verify(reserve).accept(image.getObjectKey());
        calls.verify(minio).upload(eq(image.getObjectKey()), any(byte[].class), eq("image/png"),
                eq(Map.of("Cache-Control", "private, no-store")));
    }

    @Test
    void rejectsCorruptImageBeforeCallingStorage() {
        var invalid = new MockMultipartFile("file", "fake.png", "image/png", new byte[]{1, 2, 3});
        assertThatExceptionOfType(MediaException.class)
                .isThrownBy(() -> media.storeCommentImage(7L, invalid, key -> {}))
                .extracting(MediaException::getError).isEqualTo(MediaErrorCode.INVALID_IMAGE);
        verifyNoInteractions(minio);
    }

    private static MockMultipartFile png(String filename, int width, int height) throws IOException {
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "png", bytes);
        return new MockMultipartFile("file", filename, "image/png", bytes.toByteArray());
    }
}

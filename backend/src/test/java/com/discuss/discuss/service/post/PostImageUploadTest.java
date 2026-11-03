package com.discuss.discuss.service.post;

import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.ImageKind;
import com.discuss.discuss.repository.*;
import com.discuss.discuss.service.media.*;
import com.discuss.discuss.service.user.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.*;
import org.springframework.transaction.support.SimpleTransactionStatus;
import java.util.function.Consumer;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PostImageUploadTest {
    @Test void commitsOwnershipBeforeWritingMinioAndKeepsLeaseOnStorageFailure() {
        var processor = mock(ImageProcessingService.class);
        var minio = mock(MinioService.class);
        var users = mock(UserService.class);
        var uploads = mock(PostImageUploadRepository.class);
        var media = mock(PostMediaRepository.class);
        var manager = mock(PlatformTransactionManager.class);
        var storage = new MediaStorageService(processor, minio);
        var service = new PostImageService(storage, minio, users, uploads, media, manager);
        var file = new MockMultipartFile("file", "image.png", "image/png", new byte[]{1,2,3});
        when(users.getCurrentUser()).thenReturn(User.builder().id(12L).build());
        when(processor.process(file, ImageKind.POST)).thenReturn(new ImageProcessingService.Processed(new byte[]{1,2,3}, 300, 200, "image/png"));
        when(manager.getTransaction(any())).thenReturn(new SimpleTransactionStatus());
        doThrow(new RuntimeException("Storage offline")).when(minio).upload(anyString(), any(byte[].class), anyString());
        assertThrows(RuntimeException.class, () -> service.upload(file));
        var order = inOrder(uploads, manager, minio);
        order.verify(manager).getTransaction(any());
        order.verify(uploads).saveAndFlush(argThat(upload ->
                upload.getObjectKey().startsWith("posts/draft-12/") && upload.getUser().getId() == 12L));
        order.verify(manager).commit(any());
        order.verify(minio).upload(anyString(), any(byte[].class), eq("image/png"));
        verify(uploads, never()).delete(any());
    }
}

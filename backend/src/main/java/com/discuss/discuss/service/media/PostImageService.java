package com.discuss.discuss.service.media;

import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.exception.media.MediaException;
import com.discuss.discuss.exception.media.MediaErrorCode;
import com.discuss.discuss.repository.*;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.*;

@Service @RequiredArgsConstructor @Slf4j
@EnableScheduling
public class PostImageService {
    private final MediaStorageService storage;
    private final MinioService minio;
    private final UserService users;
    private final PostImageUploadRepository uploads;
    private final PostMediaRepository media;
    private final PlatformTransactionManager transactionManager;

    public StoredImageDTO upload(MultipartFile file) {
        User user = users.getCurrentUser();

        TransactionTemplate reservation = new TransactionTemplate(transactionManager);
        reservation.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return storage.storePostDraft(user.getId(), file, key -> {
            reservation.executeWithoutResult(status -> uploads.saveAndFlush(PostImageUpload.builder()
                    .objectKey(key).user(user).expiresAt(LocalDateTime.now().plusHours(24)).build()));
        });
    }

    /** Locks serialize claiming/releasing references with cleanup. Keys are locked in a stable order. */
    public void validateAndLock(Collection<String> keys, User user) {
        keys.stream().sorted().forEach(key -> {
            if (!storage.isManagedKey(key) || !key.startsWith("posts/draft-" + user.getId() + "/"))
                throw new MediaException(MediaErrorCode.MEDIA_ACCESS_DENIED);
            PostImageUpload upload = uploads.lockByKey(key).orElseThrow(() ->
                    new MediaException(MediaErrorCode.UPLOAD_NOT_FOUND));
            if (!Objects.equals(upload.getUser().getId(), user.getId()))
                throw new MediaException(MediaErrorCode.MEDIA_ACCESS_DENIED);
            if (upload.getExpiresAt().isBefore(LocalDateTime.now()) && !media.existsByObjectKey(key))
                throw new MediaException(MediaErrorCode.UPLOAD_EXPIRED);
            try {
                String contentType = minio.stat(key).contentType();
                if (!Set.of("image/jpeg", "image/png", "image/webp").contains(contentType))
                    throw new IllegalStateException("Unexpected image content type");
            } catch (RuntimeException ex) {
                throw new MediaException(MediaErrorCode.MEDIA_NOT_FOUND, MediaErrorCode.MEDIA_NOT_FOUND.getDefaultMessage(), ex);
            }
            upload.setExpiresAt(LocalDateTime.now().plusHours(24));
        });
    }

    public void release(Collection<String> keys) {
        keys.stream().filter(Objects::nonNull).distinct().sorted().forEach(key ->
                uploads.lockByKey(key).ifPresent(upload -> upload.setExpiresAt(LocalDateTime.now().plusHours(24))));
    }

    @Scheduled(fixedDelayString = "${media.post-image.cleanup-delay-ms:3600000}",
            initialDelayString = "${media.post-image.cleanup-delay-ms:3600000}")
    @Transactional
    public void cleanup() {
        LocalDateTime now = LocalDateTime.now();
        for (String key : uploads.findExpiredKeys(now, PageRequest.of(0, 100))) {
            var upload = uploads.lockByKey(key).orElse(null);
            if (upload == null || !upload.getExpiresAt().isBefore(now)) continue;
            if (media.existsByObjectKey(key)) {
                // Avoid starving orphan uploads behind older, referenced images in the batch.
                upload.setExpiresAt(now.plusHours(24));
                continue;
            }
            try {
                minio.deleteFile(key); // Failures leave the row for retry; never use safeDelete here.
                uploads.delete(upload);
            } catch (RuntimeException ex) {
                log.warn("Post image cleanup failed for {}", key, ex);
            }
        }
    }
}

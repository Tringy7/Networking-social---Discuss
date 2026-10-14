package com.discuss.discuss.service.media;

import com.discuss.discuss.enums.ImageKind;
import com.discuss.discuss.exception.media.MediaErrorCode;
import com.discuss.discuss.exception.media.MediaException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaStorageService {

    private static final Pattern SAFE_KEY =
            Pattern.compile("^(avatars|posts|communities)/[A-Za-z0-9_\\-]+(/[A-Za-z0-9_\\-]+)*\\.webp$");

    private final ImageProcessingService imageProcessor;
    private final MinioService minioService;

    @Value("${media.image.max-files-per-request}")
    private int maxFiles;

    public record StoredImage(String objectKey, String url, String contentType,
                              int width, int height, long size) {}

    public StoredImage storeAvatar(Long userId, MultipartFile file) {
        return store(file, ImageKind.AVATAR, "avatars/%s/%s.webp".formatted(userId, UUID.randomUUID()));
    }

    public StoredImage storeCommunityIcon(String communityId, MultipartFile file) {
        return store(file, ImageKind.COMMUNITY_ICON,
                "communities/%s/icon/%s.webp".formatted(communityId, UUID.randomUUID()));
    }

    public StoredImage storeCommunityBanner(String communityId, MultipartFile file) {
        return store(file, ImageKind.BANNER,
                "communities/%s/banner/%s.webp".formatted(communityId, UUID.randomUUID()));
    }

    public StoredImage storePostImage(String postId, MultipartFile file) {
        return store(file, ImageKind.POST, "posts/%s/%s.webp".formatted(postId, UUID.randomUUID()));
    }

    /** All-or-nothing: if any image fails, delete the images already uploaded in this request. */
    public List<StoredImage> storePostImages(String postId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new MediaException(MediaErrorCode.EMPTY_FILE, "No files provided");
        }
        if (files.size() > maxFiles) {
            throw new MediaException(
                    MediaErrorCode.TOO_MANY_FILES,
                    "A maximum of " + maxFiles + " images is allowed per request"
            );
        }

        List<StoredImage> done = new ArrayList<>();
        try {
            for (MultipartFile f : files) {
                done.add(storePostImage(postId, f));
            }
            return done;
        } catch (RuntimeException e) {
            // Roll back objects already uploaded; safeDelete never throws
            done.forEach(s -> safeDelete(s.objectKey()));
            throw e;
        }
    }

    public void safeDelete(String objectKey) {
        try {
            minioService.deleteFile(objectKey);
        } catch (Exception e) {
            log.warn("Failed to delete object {}, cleanup required: {}", objectKey, e.getMessage());        }
    }

    public boolean isManagedKey(String key) {
        return key != null && key.length() < 300 && SAFE_KEY.matcher(key).matches();
    }

    private StoredImage store(MultipartFile file, ImageKind kind, String key) {
        try {
            var p = imageProcessor.process(file, kind);
            minioService.upload(key, p.data(), p.contentType());
            return new StoredImage(key, minioService.buildFileUrl(key), p.contentType(),
                    p.width(), p.height(), p.data().length);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new MediaException(MediaErrorCode.STORAGE_UPLOAD_FAILED);
        }
    }
}
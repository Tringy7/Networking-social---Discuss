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
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class MediaStorageService {

    /** Content type thực tế của byte đầu ra -> phần mở rộng của object key. */
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    /** Key hợp lệ do backend sinh ra: prefix cố định, chỉ ký tự an toàn, đuôi jpg/png/webp. */
    private static final Pattern SAFE_KEY = Pattern.compile(
            "^(avatars|posts|communities)/[A-Za-z0-9_\\-]+(/[A-Za-z0-9_\\-]+)*\\.(jpg|png|webp)$");

    private final ImageProcessingService imageProcessor;
    private final MinioService minioService;

    @Value("${media.image.max-files-per-request}")
    private int maxFiles;

    public record StoredImage(String objectKey, String url, String contentType,
                              int width, int height, long size) {}

    // ------------------------------------------------------------------ public API

    public StoredImage storeAvatar(Long userId, MultipartFile file) {
        return store(file, ImageKind.AVATAR, avatarPrefix(userId));
    }

    public StoredImage storeCommunityIcon(String communityId, MultipartFile file) {
        return store(file, ImageKind.COMMUNITY_ICON, "communities/%s/icon/".formatted(communityId));
    }

    public StoredImage storeCommunityBanner(String communityId, MultipartFile file) {
        return store(file, ImageKind.BANNER, "communities/%s/banner/".formatted(communityId));
    }

    public StoredImage storePostImage(String postId, MultipartFile file) {
        return store(file, ImageKind.POST, "posts/%s/".formatted(postId));
    }

    /** All-or-nothing: if any image fails, delete the images already uploaded in this request. */
    public List<StoredImage> storePostImages(String postId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new MediaException(MediaErrorCode.EMPTY_FILE, "No files provided");
        }
        if (files.size() > maxFiles) {
            throw new MediaException(MediaErrorCode.TOO_MANY_FILES,
                    "A maximum of " + maxFiles + " images is allowed per request");
        }

        List<StoredImage> done = new ArrayList<>();
        try {
            for (MultipartFile f : files) {
                done.add(storePostImage(postId, f));
            }
            return done;
        } catch (RuntimeException e) {
            done.forEach(s -> safeDelete(s.objectKey())); // safeDelete never throws
            throw e;
        }
    }

    public void safeDelete(String objectKey) {
        try {
            minioService.deleteFile(objectKey);
        } catch (Exception e) {
            log.warn("[MEDIA-ORPHAN] key={} reason={}", objectKey, e.getMessage());
        }
    }

    public boolean isManagedKey(String key) {
        return key != null && key.length() < 300 && SAFE_KEY.matcher(key).matches();
    }

    /** Một nơi duy nhất định nghĩa prefix avatar (dùng cả khi kiểm tra quyền sở hữu). */
    public String avatarPrefix(Long userId) {
        return "avatars/%s/".formatted(userId);
    }

    // ------------------------------------------------------------------ internal

    /**
     * Xử lý ảnh trước, rồi mới sinh key, vì phần mở rộng phụ thuộc định dạng đầu ra.
     * Lỗi dữ liệu (MediaException từ process) được giữ nguyên mã lỗi 4xx.
     * Chỉ lỗi khi ghi lên MinIO mới là STORAGE_UPLOAD_FAILED.
     */
    private StoredImage store(MultipartFile file, ImageKind kind, String prefix) {
        var processed = imageProcessor.process(file, kind);   // ném MediaException nếu ảnh không hợp lệ

        String key = prefix + UUID.randomUUID() + extensionFor(processed.contentType());
        try {
            minioService.upload(key, processed.data(), processed.contentType());
        } catch (MediaException e) {
            throw e;
        } catch (Exception e) {
            throw new MediaException(MediaErrorCode.STORAGE_UPLOAD_FAILED, e.getMessage(), e);
        }

        return new StoredImage(key, minioService.buildFileUrl(key), processed.contentType(),
                processed.width(), processed.height(), processed.data().length);
    }

    private String extensionFor(String contentType) {
        String ext = EXTENSIONS.get(contentType);
        if (ext == null) {
            throw new MediaException(MediaErrorCode.IMAGE_PROCESSING_FAILED,
                    "Unexpected output content type: " + contentType);
        }
        return ext;
    }
}
package com.discuss.discuss.service.media;

import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.enums.ImageKind;
import com.discuss.discuss.exception.media.MediaErrorCode;
import com.discuss.discuss.exception.media.MediaException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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

    /** Key hợp lệ do backend sinh ra: thư mục gốc cố định, chỉ ký tự an toàn, đuôi jpg/png/webp. */
    private static final Pattern SAFE_KEY = Pattern.compile(
            "^profiles/[A-Za-z0-9_\\-]+(/[A-Za-z0-9_\\-]+)*\\.(jpg|png|webp)$");

    private final ImageProcessingService imageProcessor;
    private final MinioService minioService;

    // ------------------------------------------------------------------ public API

    /** Lưu ảnh hồ sơ người dùng. */
    public StoredImageDTO store(ImageKind kind, Object ownerId, MultipartFile file) {
        return upload(file, kind, kind.prefixFor(ownerId));
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

    // ------------------------------------------------------------------ internal

    /**
     * Xử lý ảnh trước, rồi mới sinh key, vì phần mở rộng phụ thuộc định dạng đầu ra.
     * Lỗi dữ liệu (MediaException từ process) được giữ nguyên mã lỗi 4xx.
     * Chỉ lỗi khi ghi lên MinIO mới là STORAGE_UPLOAD_FAILED.
     */
    private StoredImageDTO upload(MultipartFile file, ImageKind kind, String prefix) {
        var processed = imageProcessor.process(file, kind);

        String key = prefix + UUID.randomUUID() + extensionFor(processed.contentType());
        try {
            minioService.upload(key, processed.data(), processed.contentType());
        } catch (MediaException e) {
            throw e;
        } catch (Exception e) {
            throw new MediaException(MediaErrorCode.STORAGE_UPLOAD_FAILED, e.getMessage(), e);
        }

        return new StoredImageDTO(key, minioService.buildFileUrl(key), processed.contentType(),
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
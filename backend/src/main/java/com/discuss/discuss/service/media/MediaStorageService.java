package com.discuss.discuss.service.media;

import com.discuss.discuss.dto.media.StoredCommentImageDTO;
import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.enums.ImageKind;
import com.discuss.discuss.exception.media.MediaErrorCode;
import com.discuss.discuss.exception.media.MediaException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
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
            "^(profiles|posts|communities)/[A-Za-z0-9_\\-]+(/[A-Za-z0-9_\\-]+)*\\.(jpg|png|webp)$");

    /** Ảnh comment là private, không cho cache. */
    private static final Map<String, String> PRIVATE_HEADERS = Map.of("Cache-Control", "private, no-store");

    private final ImageProcessingService imageProcessor;
    private final MinioService minioService;

    @Value("${media.image.max-files-per-request}")
    private int maxFiles;

    // ------------------------------------------------------------------ public API

    /** Lưu một ảnh. ownerId là userId / communityId / postId tùy kind. */
    public StoredImageDTO store(ImageKind kind, Object ownerId, MultipartFile file) {
        return upload(file, kind, kind.prefixFor(ownerId), key -> {});
    }

    /** Persist the ownership lease before writing bytes, so interrupted uploads remain collectible. */
    public StoredImageDTO storePostDraft(Object ownerId, MultipartFile file, Consumer<String> reserve) {
        return upload(file, ImageKind.POST, ImageKind.POST.prefixFor("draft-" + ownerId), reserve);
    }

    /** All-or-nothing: if any image fails, delete the images already uploaded in this request. */
    public List<StoredImageDTO> storePostImages(String postId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new MediaException(MediaErrorCode.EMPTY_FILE, "No files provided");
        }
        if (files.size() > maxFiles) {
            throw new MediaException(MediaErrorCode.TOO_MANY_FILES,
                    "A maximum of " + maxFiles + " images is allowed per request");
        }

        List<StoredImageDTO> done = new ArrayList<>();
        try {
            for (MultipartFile f : files) {
                done.add(store(ImageKind.POST, postId, f));
            }
            return done;
        } catch (RuntimeException e) {
            done.forEach(s -> safeDelete(s.getObjectKey())); // safeDelete never throws
            throw e;
        }
    }

    public void validateCommentImages(List<MultipartFile> images) {
        imageProcessor.validateCommentImages(images);
    }

    /** Lưu ảnh comment. reserve(key) được gọi TRƯỚC khi ghi byte để upload bị gián đoạn vẫn dọn được. */
    public StoredCommentImageDTO storeCommentImage(Long commentId, MultipartFile file, Consumer<String> reserve) {
        var processed = imageProcessor.processComment(file);

        String key = "comments/" + commentId + "/" + UUID.randomUUID();
        putObject(key, processed.data(), processed.contentType(), PRIVATE_HEADERS, reserve);

        return new StoredCommentImageDTO(key, sanitizeFileName(file.getOriginalFilename()),
                processed.contentType(), processed.data().length);
    }

    public InputStream openImage(String objectKey) {
        try {
            return minioService.getFileInputStream(objectKey);
        } catch (RuntimeException ex) {
            throw new MediaException(MediaErrorCode.STORAGE_READ_FAILED,
                    MediaErrorCode.STORAGE_READ_FAILED.getDefaultMessage(), ex);
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

    // ------------------------------------------------------------------ internal

    /**
     * Xử lý ảnh trước, rồi mới sinh key, vì phần mở rộng phụ thuộc định dạng đầu ra.
     * Lỗi dữ liệu (MediaException từ process) được giữ nguyên mã lỗi 4xx.
     * Chỉ lỗi khi ghi lên MinIO mới là STORAGE_UPLOAD_FAILED.
     */
    private StoredImageDTO upload(MultipartFile file, ImageKind kind, String prefix, Consumer<String> reserve) {
        var processed = imageProcessor.process(file, kind);

        String key = prefix + UUID.randomUUID() + extensionFor(processed.contentType());
        putObject(key, processed.data(), processed.contentType(), Map.of(), reserve);

        return new StoredImageDTO(key, minioService.buildFileUrl(key), processed.contentType(),
                processed.width(), processed.height(), processed.data().length);
    }

    /**
     * Bước chung cho mọi loại ảnh: reserve key TRƯỚC khi ghi byte (upload bị gián đoạn vẫn dọn được),
     * giữ nguyên MediaException, các lỗi còn lại bọc thành STORAGE_UPLOAD_FAILED.
     */
    private void putObject(String key, byte[] data, String contentType,
                           Map<String, String> headers, Consumer<String> reserve) {
        reserve.accept(key);
        try {
            if (headers.isEmpty()) {
                minioService.upload(key, data, contentType);
            } else {
                minioService.upload(key, data, contentType, headers);
            }
        } catch (MediaException e) {
            throw e;
        } catch (Exception e) {
            throw new MediaException(MediaErrorCode.STORAGE_UPLOAD_FAILED, e.getMessage(), e);
        }
    }

    /** Bỏ đường dẫn, ký tự điều khiển; giới hạn 255 ký tự (giữ phần đuôi để không mất extension). */
    private static String sanitizeFileName(String originalName) {
        String name = Optional.ofNullable(originalName).orElse("image.png").replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[\\p{Cntrl}]", "_");
        if (name.isBlank()) return "image.png";
        return name.length() > 255 ? name.substring(name.length() - 255) : name;
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
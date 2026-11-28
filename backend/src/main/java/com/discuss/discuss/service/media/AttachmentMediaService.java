package com.discuss.discuss.service.media;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AttachmentMediaService {
    private final MinioService storage;
    private final ImageService images;

    public record StoredAttachment(String objectKey, String filename, String contentType) {}

    @Transactional(propagation = Propagation.MANDATORY, rollbackFor = IOException.class)
    public StoredAttachment storeChatAttachment(long messageId, MultipartFile file) throws IOException {
        String filename = normalizeFilename(file.getOriginalFilename());
        byte[] bytes = file.getBytes();
        String contentType = detectMedia(bytes);
        if (contentType.startsWith("image/")) {
            var image = images.storeChatImage(messageId, bytes, contentType, filename);
            return new StoredAttachment(image.objectKey(), image.filename(), image.contentType());
        }

        String key = storeFile(bytes, contentType, filename);
        return new StoredAttachment(key, filename, contentType);
    }

    public String getChatAttachmentUrl(String objectKey) {
        return storage.getPresignedUrl(objectKey, 2);
    }

    private String normalizeFilename(String filename) {
        if (filename == null) {
            return "attachment";
        }
        String normalized = filename.replace('\\', '_').replaceAll("[\\p{Cntrl}/]", "_").strip();
        if (normalized.isBlank()) {
            return "attachment";
        }
        return normalized.substring(0, Math.min(normalized.length(), 180));
    }

    private String storeFile(byte[] bytes, String contentType, String filename) {
        String key = "chat/" + UUID.randomUUID();
        String disposition = ("video/mp4".equals(contentType)
                ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(filename, StandardCharsets.UTF_8).build().toString();

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    storage.deleteFile(key);
                }
            }
        });
        storage.upload(key, bytes, contentType,
                Map.of("Cache-Control", "private, no-store", "Content-Disposition", disposition));
        return key;
    }

    static String detectMedia(byte[] bytes) {
        if (bytes.length >= 12) {
            if (bytes[0] == (byte) 0x89 && magic(bytes, 1, "PNG\r\n\u001a\n")) return "image/png";
            if (bytes[0] == (byte) 0xff && bytes[1] == (byte) 0xd8 && bytes[2] == (byte) 0xff) return "image/jpeg";
            if (magic(bytes, 0, "GIF87a") || magic(bytes, 0, "GIF89a")) return "image/gif";
            if (magic(bytes, 0, "RIFF") && magic(bytes, 8, "WEBP")) return "image/webp";
            if (magic(bytes, 4, "ftyp")) return "video/mp4";
        }
        return "application/octet-stream";
    }

    private static boolean magic(byte[] bytes, int offset, String value) {
        for (int index = 0; index < value.length(); index++) {
            if (bytes[offset + index] != value.charAt(index)) return false;
        }
        return true;
    }
}

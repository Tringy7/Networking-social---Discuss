package com.discuss.discuss.service.media;

import com.discuss.discuss.dto.media.FileUploadResponseDTO;
import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinioService {

    private final MinioClient minioClient;

    @Value("${minio.endpoint:http://localhost:9000}")
    private String endpoint;

    @Value("${minio.bucket:discuss-media}")
    private String defaultBucket;

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "video/mp4",
            "video/webm",
            "video/quicktime"
    );

    /**
     * Upload a single file to MinIO
     */
    public FileUploadResponseDTO uploadFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported file type: " + contentType);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String cleanFolder = (folder == null || folder.isBlank()) ? "posts" : folder.trim();

        LocalDate now = LocalDate.now();
        String objectKey = String.format("%s/%d/%02d/%s%s",
                cleanFolder,
                now.getYear(),
                now.getMonthValue(),
                UUID.randomUUID(),
                extension
        );

        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(defaultBucket)
                            .object(objectKey)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(contentType)
                            .build()
            );

            String fileUrl = buildFileUrl(objectKey);
            log.info("Uploaded file to MinIO: key={}, size={} bytes", objectKey, file.getSize());

            return FileUploadResponseDTO.builder()
                    .objectKey(objectKey)
                    .fileName(objectKey.substring(objectKey.lastIndexOf('/') + 1))
                    .originalFileName(originalFilename)
                    .fileUrl(fileUrl)
                    .contentType(contentType)
                    .size(file.getSize())
                    .build();
        } catch (Exception e) {
            log.error("Failed to upload file to MinIO: {}", e.getMessage(), e);
            throw new RuntimeException("Could not upload file to MinIO: " + e.getMessage(), e);
        }
    }

    /**
     * Upload multiple files to MinIO
     */
    public List<FileUploadResponseDTO> uploadMultipleFiles(List<MultipartFile> files, String folder) {
        List<FileUploadResponseDTO> responses = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                responses.add(uploadFile(file, folder));
            }
        }
        return responses;
    }

    /**
     * Delete a file from MinIO by its object key
     */
    public void deleteFile(String objectKey) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(defaultBucket)
                            .object(objectKey)
                            .build()
            );
            log.info("Deleted file from MinIO: {}", objectKey);
        } catch (Exception e) {
            log.error("Failed to delete file from MinIO: {}", e.getMessage(), e);
            throw new RuntimeException("Could not delete file from MinIO: " + e.getMessage(), e);
        }
    }

    /**
     * Generate presigned GET URL with specified expiration in minutes
     */
    public String getPresignedUrl(String objectKey, int expiryMinutes) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(defaultBucket)
                            .object(objectKey)
                            .expiry(expiryMinutes, TimeUnit.MINUTES)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to generate presigned URL: {}", e.getMessage(), e);
            throw new RuntimeException("Could not generate presigned URL: " + e.getMessage(), e);
        }
    }

    /**
     * Get InputStream for an object
     */
    public InputStream getFileInputStream(String objectKey) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(defaultBucket)
                            .object(objectKey)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to retrieve file from MinIO: {}", e.getMessage(), e);
            throw new RuntimeException("Could not retrieve file: " + e.getMessage(), e);
        }
    }

    /**
     * Upload raw bytes to MinIO with default immutable cache header
     */
    public void upload(String key, byte[] data, String contentType) {
        upload(key, data, contentType, java.util.Map.of("Cache-Control", "public, max-age=31536000, immutable"));
    }

    /**
     * Upload raw bytes to MinIO with custom headers
     */
    public void upload(String key, byte[] data, String contentType, java.util.Map<String, String> headers) {
        try (java.io.InputStream in = new java.io.ByteArrayInputStream(data)) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(defaultBucket)
                            .object(key)
                            .stream(in, data.length, -1)
                            .contentType(contentType)
                            .headers(headers)
                            .build()
            );
            log.info("Uploaded raw bytes to MinIO: key={}, size={} bytes", key, data.length);
        } catch (Exception e) {
            log.error("Failed to upload raw bytes to MinIO: {}", e.getMessage(), e);
            throw new RuntimeException("Could not upload to MinIO: " + e.getMessage(), e);
        }
    }

    public String buildFileUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }

        return endpoint.replaceAll("/+$", "")
                + "/" + defaultBucket
                + "/" + objectKey;
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    public StatObjectResponse stat(String objectKey) {
        try {
            return minioClient.statObject(
                    StatObjectArgs.builder().bucket(defaultBucket).object(objectKey).build());
        } catch (Exception e) {
            throw new RuntimeException("Object not found or unreadable: " + objectKey, e);
        }
    }
}


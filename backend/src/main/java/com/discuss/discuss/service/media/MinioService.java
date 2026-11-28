package com.discuss.discuss.service.media;

import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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
}


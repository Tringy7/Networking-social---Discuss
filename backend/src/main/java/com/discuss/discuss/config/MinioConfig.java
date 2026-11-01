package com.discuss.discuss.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.SetBucketPolicyArgs;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class MinioConfig {

    @Value("${minio.endpoint:http://localhost:9000}")
    private String endpoint;

    @Value("${minio.access-key:minioadmin}")
    private String accessKey;

    @Value("${minio.secret-key:minioadmin123}")
    private String secretKey;

    @Value("${minio.bucket:discuss-media}")
    private String defaultBucket;

    @Bean
    public MinioClient minioClient() {
        MinioClient client = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();

        try {
            boolean bucketExists = client.bucketExists(
                    BucketExistsArgs.builder().bucket(defaultBucket).build()
            );

            if (!bucketExists) {
                client.makeBucket(
                        MakeBucketArgs.builder().bucket(defaultBucket).build()
                );
                log.info("Bucket '{}' created successfully in MinIO.", defaultBucket);
            }

            // Luôn áp dụng policy, kể cả khi bucket đã tồn tại từ trước
            String policy = """
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Effect": "Allow",
                      "Principal": {"AWS": ["*"]},
                      "Action": ["s3:GetObject"],
                      "Resource": ["arn:aws:s3:::%s/*"]
                    }
                  ]
                }
                """.formatted(defaultBucket);

            client.setBucketPolicy(
                    SetBucketPolicyArgs.builder()
                            .bucket(defaultBucket)
                            .config(policy)
                            .build()
            );
            log.info("Public read policy configured for bucket '{}'.", defaultBucket);

        } catch (Exception e) {
            log.warn("MinIO bucket initialization notice for '{}': {}", defaultBucket, e.getMessage());
        }

        return client;
    }
}

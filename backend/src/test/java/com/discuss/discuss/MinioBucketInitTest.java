package com.discuss.discuss;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.SetBucketPolicyArgs;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;

class MinioBucketInitTest {

    @Test
    void testMinioConnectionAndCreateBucket() throws Exception {
        MinioClient client = MinioClient.builder()
                .endpoint("http://localhost:9000")
                .credentials("minioadmin", "minioadmin123")
                .build();

        String bucket = "discuss-media";
        boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!exists) {
            client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            System.out.println("Bucket " + bucket + " created successfully!");
        } else {
            System.out.println("Bucket " + bucket + " already exists.");
        }

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
                """.formatted(bucket);

        client.setBucketPolicy(SetBucketPolicyArgs.builder().bucket(bucket).config(policy).build());
        System.out.println("Bucket policy set successfully!");

        byte[] testBytes = "Hello MinIO DISCUSS".getBytes();
        client.putObject(
                PutObjectArgs.builder()
                        .bucket(bucket)
                        .object("test/hello.txt")
                        .stream(new ByteArrayInputStream(testBytes), testBytes.length, -1)
                        .contentType("text/plain")
                        .build()
        );
        System.out.println("Test upload succeeded: test/hello.txt");
    }
}

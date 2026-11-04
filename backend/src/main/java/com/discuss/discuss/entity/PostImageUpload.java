package com.discuss.discuss.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/** Ownership and garbage-collection lease for pre-uploaded post images. */
@Entity
@Table(name = "post_image_uploads", indexes = @Index(name = "idx_post_upload_expiry", columnList = "expires_at"))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PostImageUpload {
    @Id @Column(length = 300)
    private String objectKey;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(nullable = false)
    private LocalDateTime expiresAt;
}

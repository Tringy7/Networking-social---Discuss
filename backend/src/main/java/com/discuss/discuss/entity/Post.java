package com.discuss.discuss.entity;

import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.PostType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "community_id", nullable = false)
    private Community community;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", length = 16)
    private PostType type;

    @Column(nullable = false)
    private Boolean isPinned;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostStatus status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    private Long deletedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private PostStatus statusBeforeModerationRemoval;

    public boolean isModerationRemoval() {
        return status == PostStatus.DELETED && (statusBeforeModerationRemoval != null
                || (deletedByUserId != null && !Objects.equals(deletedByUserId, user.getId())));
    }
}

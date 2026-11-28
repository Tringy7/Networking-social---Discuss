package com.discuss.discuss.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "community_notification_preferences")
@IdClass(CommunityNotificationPreference.Key.class)
@Getter
@NoArgsConstructor
public class CommunityNotificationPreference {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "community_id")
    private Long communityId;

    @Column(name = "new_post_enabled", nullable = false)
    private boolean newPostEnabled;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public record Key(Long userId, Long communityId) implements java.io.Serializable {}
}

package com.discuss.discuss.repository;

import com.discuss.discuss.entity.CommunityNotificationPreference;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommunityNotificationPreferenceRepository extends
        JpaRepository<CommunityNotificationPreference, CommunityNotificationPreference.Key> {
    @Modifying
    @Query(value = """
            insert into community_notification_preferences (user_id, community_id, new_post_enabled, updated_at)
            values (:userId, :communityId, :enabled, :updatedAt)
            on duplicate key update new_post_enabled = :enabled, updated_at = :updatedAt
            """, nativeQuery = true)
    void savePreference(@Param("userId") Long userId, @Param("communityId") Long communityId,
                        @Param("enabled") boolean enabled, @Param("updatedAt") LocalDateTime updatedAt);
}

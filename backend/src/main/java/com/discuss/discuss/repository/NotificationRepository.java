package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Notification;
import com.discuss.discuss.enums.NotificationType;
import java.util.Collection;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    @EntityGraph(attributePaths = {"actor", "actor.profile"})
    Page<Notification> findByRecipientIdAndTypeNotIn(Long recipientId, Collection<NotificationType> excludedTypes, Pageable pageable);

    @EntityGraph(attributePaths = {"actor", "actor.profile"})
    Page<Notification> findByRecipientIdAndTypeNotInAndReadAtIsNull(
            Long recipientId, Collection<NotificationType> excludedTypes, Pageable pageable);

    long countByRecipientIdAndTypeNotInAndReadAtIsNull(Long recipientId, Collection<NotificationType> excludedTypes);

    boolean existsByIdAndRecipientId(Long id, Long recipientId);

    @Modifying
    @Query("""
            update Notification n set n.readAt = :readAt
            where n.id = :id and n.recipientId = :recipientId and n.readAt is null
            """)
    int markRead(@Param("id") Long id, @Param("recipientId") Long recipientId,
                 @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("""
            update Notification n set n.readAt = :readAt
            where n.recipientId = :recipientId and n.readAt is null
            """)
    void markAllRead(@Param("recipientId") Long recipientId, @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("delete from Notification n where n.recipientId = :recipientId and n.readAt is not null")
    void deleteReadNotifications(@Param("recipientId") Long recipientId);
}

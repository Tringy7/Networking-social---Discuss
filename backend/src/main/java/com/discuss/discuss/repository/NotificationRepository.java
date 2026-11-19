package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Notification;
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
    Page<Notification> findByRecipientId(Long recipientId, Pageable pageable);

    @EntityGraph(attributePaths = {"actor", "actor.profile"})
    Page<Notification> findByRecipientIdAndReadAtIsNull(Long recipientId, Pageable pageable);

    long countByRecipientIdAndReadAtIsNull(Long recipientId);

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
}

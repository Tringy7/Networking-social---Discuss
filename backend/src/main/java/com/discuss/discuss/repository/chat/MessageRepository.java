package com.discuss.discuss.repository.chat;

import com.discuss.discuss.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByConversationIdAndIdLessThanOrderByIdDesc(Long conversationId, Long before, Pageable page);
    Optional<Message> findByConversationIdAndSenderIdAndClientId(Long conversationId, Long senderId, String clientId);
    @Query("""
            select count(m) from Message m
            where m.conversationId = :conversationId and m.senderId <> :actor and m.id > :cursor
              and m.recalledAt is null and :actor not member of m.hiddenFor
            """)
    long countUnread(long conversationId, long actor, long cursor);
}

package com.discuss.discuss.repository.chat;

import com.discuss.discuss.entity.ChatRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ChatRequestRepository extends JpaRepository<ChatRequest, Long> {
    Optional<ChatRequest> findByConversationId(Long conversationId);
}

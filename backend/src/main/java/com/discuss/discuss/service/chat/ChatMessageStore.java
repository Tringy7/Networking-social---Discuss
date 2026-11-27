package com.discuss.discuss.service.chat;

import com.discuss.discuss.entity.Message;
import com.discuss.discuss.exception.chat.ChatErrorCode;
import com.discuss.discuss.exception.chat.ChatException;
import com.discuss.discuss.repository.chat.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
class ChatMessageStore {
    private final MessageRepository messages;

    public Message insert(long id, long actor, String text, Long clientId) {
        var message = new Message();
        message.setConversationId(id);
        message.setSenderId(actor);
        message.setBody(text.strip());
        message.setClientId(clientId.toString());
        message.setCreatedAt(Instant.now().truncatedTo(ChronoUnit.MICROS));
        return messages.save(message);
    }

    public Message findMessage(long id, long messageId) {
        return messages.findById(messageId).filter(message -> message.getConversationId().equals(id))
                .orElseThrow(() -> new ChatException(ChatErrorCode.MESSAGE_NOT_FOUND));
    }

    public static boolean hidden(Message message, long actor) {
        return message.getHiddenFor().contains(actor);
    }

    public Message requireVisibleMessage(long conversationId, long messageId, long userId) {
        var message = findMessage(conversationId, messageId);
        if (hidden(message, userId) || message.getRecalledAt() != null) {
            throw new ChatException(ChatErrorCode.MESSAGE_NOT_FOUND);
        }
        return message;
    }
}

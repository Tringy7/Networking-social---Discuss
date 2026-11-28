package com.discuss.discuss.service.chat;

import com.discuss.discuss.entity.ChatRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
class ChatChangePublisher {
    private final ApplicationEventPublisher events;

    public void changed(ChatRequest request) {
        publish(request, "chat");
    }

    public void messageSent(ChatRequest request) {
        publish(request, "chat-message");
    }

    public void read(ChatRequest request) {
        publish(request, "chat-read");
    }

    private void publish(ChatRequest request, String event) {
        events.publishEvent(new ChatUpdates.Changed(
                Set.of(request.getSenderId(), request.getRecipientId()), request.getConversationId(), event));
    }

    public void changed(long actor, long id) {
        events.publishEvent(new ChatUpdates.Changed(Set.of(actor), id));
    }
}

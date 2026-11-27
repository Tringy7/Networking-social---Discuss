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
        events.publishEvent(new ChatUpdates.Changed(Set.of(request.getSenderId(), request.getRecipientId()), request.getConversationId()));
    }

    public void changed(long actor, long id) {
        events.publishEvent(new ChatUpdates.Changed(Set.of(actor), id));
    }
}

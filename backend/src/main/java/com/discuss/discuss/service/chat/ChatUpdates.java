package com.discuss.discuss.service.chat;

import com.discuss.discuss.exception.chat.ChatErrorCode;
import com.discuss.discuss.exception.chat.ChatException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatUpdates {
    public record Changed(Set<Long> recipients, long conversationId, String event) {
        public Changed(Set<Long> recipients, long conversationId) {
            this(recipients, conversationId, "chat");
        }
    }
    private record Subscription(SseEmitter emitter, Jwt token) {}
    private final ConcurrentHashMap<Long, Set<Subscription>> subscriptions = new ConcurrentHashMap<>();
    private final JwtDecoder decoder;

    public ChatUpdates(@Qualifier("jwtDecoder") JwtDecoder decoder) {
        this.decoder = decoder;
    }

    public SseEmitter subscribe(long userId, Jwt token) {
        SseEmitter emitter = new SseEmitter(300_000L);
        var subscription = new Subscription(emitter, token);
        emitter.onCompletion(() -> remove(userId, subscription));
        emitter.onTimeout(() -> remove(userId, subscription));
        emitter.onError(error -> remove(userId, subscription));
        subscriptions.compute(userId, (id, current) -> {
            var clients = current == null ? ConcurrentHashMap.<Subscription>newKeySet() : current;
            if (clients.size() >= 12) throw new ChatException(ChatErrorCode.TOO_MANY_CONNECTIONS);
            clients.add(subscription);
            return clients;
        });
        write(userId, subscription, SseEmitter.event().name("ready").reconnectTime(3000).data("ready"));
        return emitter;
    }

    @Async
    @TransactionalEventListener
    public void changed(Changed event) {
        event.recipients().forEach(userId -> publish(userId, event.event(), event.conversationId()));
    }

    public boolean online(long userId) {
        var clients = subscriptions.get(userId);
        return clients != null && clients.stream().anyMatch(client -> valid(client.token()));
    }

    private void publish(long userId, String event, long conversationId) {
        var clients = subscriptions.get(userId);
        if (clients == null) return;
        for (var client : clients) {
            try {
                if (!valid(client.token())) throw new JwtException("Expired token");
                decoder.decode(client.token().getTokenValue());
                write(userId, client, SseEmitter.event().name(event).data(conversationId));
            } catch (JwtException denied) {
                remove(userId, client);
                client.emitter().complete();
            }
        }
    }

    private static boolean valid(Jwt token) {
        return token != null && token.getExpiresAt() != null && token.getExpiresAt().isAfter(Instant.now());
    }

    private void write(long userId, Subscription client, SseEmitter.SseEventBuilder event) {
        try {
            client.emitter().send(event);
        } catch (IOException | IllegalStateException closed) {
            remove(userId, client);
            client.emitter().complete();
        }
    }

    private void remove(long userId, Subscription client) {
        subscriptions.computeIfPresent(userId, (id, clients) -> {
            clients.remove(client);
            return clients.isEmpty() ? null : clients;
        });
    }
}

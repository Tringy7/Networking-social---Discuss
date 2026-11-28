package com.discuss.discuss.controller.chat;

import com.discuss.discuss.entity.ChatRequest;
import com.discuss.discuss.repository.chat.ChatRequestRepository;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.AuthSession;
import com.discuss.discuss.repository.AuthSessionRepository;
import com.discuss.discuss.service.auth.JwtService;
import com.discuss.discuss.service.chat.ChatUpdates;
import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.Instant;
import java.util.Set;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.mock.web.MockMultipartFile;
import tools.jackson.databind.json.JsonMapper;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ChatControllerIntegrationTest extends AbstractApiIntegrationTest {
    private static final AtomicLong CLIENT_IDS = new AtomicLong();
    @Autowired private AuthSessionRepository sessions;
    @Autowired private UserRepository users;
    @Autowired private JwtService tokens;
    @Autowired private ApplicationEventPublisher events;
    @Autowired private PlatformTransactionManager transactions;
    @Autowired
    private ChatRequestRepository chatRequests;

    private final JsonMapper json = JsonMapper.builder().build();

    @Test
    void enforcesParticipantsAndStatusAndKeepsReadReceipts() throws Exception {
        var sender = user(UserRole.USER);
        var recipient = user(UserRole.USER);
        var outsider = user(UserRole.ADMIN);
        var key = CLIENT_IDS.incrementAndGet();
        long id = open(sender, recipient, key);
        assertThat(open(sender, recipient, key)).isEqualTo(id);
        mvc.perform(get("/chat").with(as(recipient)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("ACCEPTED"))
                .andExpect(jsonPath("$[0].unread").value(1));
        mvc.perform(get("/chat/{id}/messages", id).with(as(recipient)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/notifications/unread-count").with(as(recipient)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.unreadCount").value(0));
        mvc.perform(get("/chat/{id}", id).with(as(recipient)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.unread").value(1))
                .andExpect(jsonPath("$.preview.text").value("hello"))
                .andExpect(jsonPath("$.preview.mine").value(false));
        mvc.perform(get("/chat/{id}", id).with(as(outsider))).andExpect(status().isNotFound());
        mvc.perform(get("/chat/{id}/messages", id).with(as(outsider))).andExpect(status().isNotFound());
        long replyKey = CLIENT_IDS.incrementAndGet();
        assertThat(open(recipient, sender, replyKey)).isEqualTo(id);
        assertThat(open(recipient, sender, replyKey)).isEqualTo(id);
        mvc.perform(get("/chat/{id}/messages", id).with(as(sender)))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));
        var sent = mvc.perform(body(post("/chat/{id}/messages", id).with(as(sender)), sendBody(CLIENT_IDS.incrementAndGet())))
                .andExpect(status().isCreated()).andReturn();
        long message = json.readTree(sent.getResponse().getContentAsString()).path("id").asLong();
        mvc.perform(body(put("/chat/{id}/read", id).with(as(recipient)), json.writeValueAsString(Map.of("through", message))))
                .andExpect(status().isNoContent());
        mvc.perform(get("/chat/{id}", id).with(as(sender)))
                .andExpect(jsonPath("$.peerReadThrough").value(message));
        mvc.perform(get("/chat/{id}/messages", id).with(as(sender))).andExpect(jsonPath("$[0].read").value(true));
        mvc.perform(body(patch("/chat/{id}/messages/{message}", id, message).with(as(recipient)), "{\"text\":\"changed\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/chat/{id}/messages/{message}", id, message).with(as(recipient))).andExpect(status().isNoContent());
        mvc.perform(get("/chat/{id}", id).with(as(recipient))).andExpect(jsonPath("$.preview.text").value("hello"));
        mvc.perform(get("/chat/{id}", id).with(as(sender))).andExpect(jsonPath("$.preview.text").value("follow-up"));
        mvc.perform(get("/chat/{id}/messages", id).with(as(sender))).andExpect(jsonPath("$[0].text").value("follow-up"));
    }

    @ParameterizedTest
    @EnumSource(value = ChatRequest.Status.class, names = {"PENDING", "REJECTED", "WITHDRAWN"})
    void allowsRepliesToConversationsWithLegacyRequestStatuses(ChatRequest.Status legacyStatus) throws Exception {
        var sender = user(UserRole.USER);
        var recipient = user(UserRole.USER);
        long id = open(sender, recipient, CLIENT_IDS.incrementAndGet());
        var request = chatRequests.findByConversationId(id).orElseThrow();
        request.setStatus(legacyStatus);
        chatRequests.save(request);

        mvc.perform(get("/chat").with(as(recipient)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("ACCEPTED"));
        mvc.perform(body(post("/chat/{id}/messages", id).with(as(recipient)), sendBody(CLIENT_IDS.incrementAndGet())))
                .andExpect(status().isCreated());
    }

    @Test
    void respectsPrivacyAndBlockDirections() throws Exception {
        var sender = user(UserRole.USER);
        var recipient = user(UserRole.USER);
        mvc.perform(body(put("/chat/privacy").with(as(recipient)), "{\"allowRequests\":false}"))
                .andExpect(status().isNoContent());
        mvc.perform(body(post("/chat/requests").with(as(sender)), openBody(recipient, CLIENT_IDS.incrementAndGet())))
                .andExpect(status().isForbidden());
        mvc.perform(body(put("/chat/privacy").with(as(recipient)), "{\"allowRequests\":true}"))
                .andExpect(status().isNoContent());
        long id = open(sender, recipient, CLIENT_IDS.incrementAndGet());
        mvc.perform(put("/chat/blocks/{username}", sender.getUsername()).with(as(recipient))).andExpect(status().isNoContent());
        mvc.perform(get("/chat").with(as(sender)))
                .andExpect(jsonPath("$[0].blocked").value(true)).andExpect(jsonPath("$[0].blockedByMe").value(false));
        mvc.perform(body(post("/chat/{id}/messages", id).with(as(sender)), sendBody(CLIENT_IDS.incrementAndGet())))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/chat/blocks/{username}", sender.getUsername()).with(as(recipient))).andExpect(status().isNoContent());
        mvc.perform(body(post("/chat/{id}/messages", id).with(as(sender)), sendBody(CLIENT_IDS.incrementAndGet())))
                .andExpect(status().isCreated());
    }

    @Test
    void rejectsInactiveParticipantsAndRejectingOpenConversations() throws Exception {
        var sender = user(UserRole.USER);
        var recipient = user(UserRole.USER);
        var locked = user(UserRole.USER);
        locked.setStatus(UserStatus.LOCKED);
        users.save(locked);
        mvc.perform(body(post("/chat/requests").with(as(sender)), openBody(locked, CLIENT_IDS.incrementAndGet())))
                .andExpect(status().isBadRequest());
        long id = open(sender, recipient, CLIENT_IDS.incrementAndGet());
        mvc.perform(body(patch("/chat/{id}/request", id).with(as(recipient)),
                        json.writeValueAsString(Map.of("status", "REJECTED"))))
                .andExpect(status().isConflict());
    }

    @Test
    void editsRepliesAndReactionsWithoutCrossingConversationBoundaries() throws Exception {
        var sender = user(UserRole.USER);
        var recipient = user(UserRole.USER);
        var other = user(UserRole.USER);
        long id = open(sender, recipient, CLIENT_IDS.incrementAndGet());
        long otherId = open(sender, other, CLIENT_IDS.incrementAndGet());
        long original = latestMessage(id, sender);
        long unrelated = latestMessage(otherId, sender);
        var invalidReply = json.writeValueAsString(Map.of("text", "reply", "clientId", CLIENT_IDS.incrementAndGet(), "replyToId", unrelated));
        mvc.perform(body(post("/chat/{id}/messages", id).with(as(recipient)), invalidReply)).andExpect(status().isNotFound());
        var reply = json.writeValueAsString(Map.of("text", "reply", "clientId", CLIENT_IDS.incrementAndGet(), "replyToId", original));
        mvc.perform(body(post("/chat/{id}/messages", id).with(as(recipient)), reply))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.replyToId").value(original));
        long message = latestMessage(id, recipient);
        mvc.perform(body(patch("/chat/{id}/messages/{message}", id, message).with(as(recipient)),
                        json.writeValueAsString(Map.of("text", "updated")))).andExpect(status().isNoContent());
        mvc.perform(body(put("/chat/{id}/messages/{message}/reaction", id, message).with(as(sender)),
                        json.writeValueAsString(Map.of("emoji", "🎉")))).andExpect(status().isBadRequest());
        mvc.perform(body(put("/chat/{id}/messages/{message}/reaction", id, message).with(as(sender)),
                        json.writeValueAsString(Map.of("emoji", "CELEBRATE")))).andExpect(status().isNoContent());
        mvc.perform(get("/chat/{id}/messages", id).with(as(sender)))
                .andExpect(jsonPath("$[0].text").value("updated"))
                .andExpect(jsonPath("$[0].editedAt").exists())
                .andExpect(jsonPath("$[0].reactions[0].emoji").value("CELEBRATE"));
        mvc.perform(delete("/chat/{id}/messages/{message}/reaction", id, message).with(as(sender)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/chat/{id}/messages", id).with(as(sender))).andExpect(jsonPath("$[0].reactions").isEmpty());
    }

    private long latestMessage(long threadId, User viewer) throws Exception {
        var result = mvc.perform(get("/chat/{id}/messages", threadId).with(as(viewer)))
                .andExpect(status().isOk()).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get(0).path("id").asLong();
    }

    @Test
    void serializesConcurrentRetriesWithTheSameClientId() throws Exception {
        var sender = user(UserRole.USER);
        var recipient = user(UserRole.USER);
        long id = open(sender, recipient, CLIENT_IDS.incrementAndGet());
        var payload = sendBody(CLIENT_IDS.incrementAndGet());
        try (var executor = Executors.newFixedThreadPool(2)) {
            var first = executor.submit(() -> mvc.perform(body(post("/chat/{id}/messages", id).with(as(sender)), payload))
                    .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
            var second = executor.submit(() -> mvc.perform(body(post("/chat/{id}/messages", id).with(as(sender)), payload))
                    .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
            assertThat(first.get(10, TimeUnit.SECONDS)).isEqualTo(second.get(10, TimeUnit.SECONDS));
        }
        mvc.perform(get("/chat/{id}/messages", id).with(as(recipient))).andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void authorizesMediaAndReportEvidenceSeparately() throws Exception {
        var sender = user(UserRole.USER);
        var recipient = user(UserRole.USER);
        var admin = user(UserRole.ADMIN);
        long id = open(sender, recipient, CLIENT_IDS.incrementAndGet());
        var file = new MockMultipartFile("files", "notes.txt", "text/plain", new byte[]{1, 2});
        var sent = mvc.perform(multipart("/chat/{id}/messages", id).file(file).param("clientId", Long.toString(CLIENT_IDS.incrementAndGet())).with(as(sender)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.attachments[0].filename").value("notes.txt")).andReturn();
        var response = json.readTree(sent.getResponse().getContentAsString());
        long message = response.path("id").asLong();
        long attachment = response.path("attachments").get(0).path("id").asLong();
        String asset = "/chat/{id}/messages/{message}/attachments/{attachment}";
        when(minio.getPresignedUrl(anyString(), eq(2))).thenReturn("https://media.example/signed");
        mvc.perform(get(asset, id, message, attachment).with(as(admin))).andExpect(status().isNotFound());
        mvc.perform(get(asset, id, message, attachment).with(as(recipient))).andExpect(status().isFound());
        String report = json.writeValueAsString(Map.of("targetType", "MESSAGE", "targetId", message, "reason", "SPAM"));
        mvc.perform(body(post("/reports").with(as(admin)), report)).andExpect(status().isNotFound());
        var filed = mvc.perform(body(post("/reports").with(as(recipient)), report)).andExpect(status().isCreated()).andReturn();
        long reportId = json.readTree(filed.getResponse().getContentAsString()).path("id").asLong();
        mvc.perform(get("/admin/reports/MESSAGE/{id}/target", reportId).with(as(recipient))).andExpect(status().isForbidden());
        mvc.perform(get("/admin/reports/MESSAGE/{id}/target", reportId).with(as(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.message.attachmentCount").value(1))
                .andExpect(jsonPath("$.message.id").value(message));
        mvc.perform(delete("/chat/{id}/messages/{message}/content", id, message).with(as(sender))).andExpect(status().isNoContent());
        mvc.perform(get(asset, id, message, attachment).with(as(recipient))).andExpect(status().isNotFound());
    }

    @Test
    void eventStreamRequiresAuthenticationAndSignalsReadiness() throws Exception {
        mvc.perform(get("/chat/events")).andExpect(status().isUnauthorized());
        var user = user(UserRole.USER);
        mvc.perform(get("/chat/events").with(as(user))).andExpect(status().isOk()).andExpect(request().asyncStarted())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("event:ready")));
    }

    @Test
    void deliversCommittedChangesAndReconnectsWithTheAccessCookie() throws Exception {
        var sender = user(UserRole.USER);
        var recipient = user(UserRole.USER);
        var cookie = accessCookie(recipient);
        var stream = mvc.perform(get("/chat/events").cookie(cookie))
                .andExpect(request().asyncStarted()).andReturn();
        try {
            new TransactionTemplate(transactions).executeWithoutResult(status -> {
                events.publishEvent(new ChatUpdates.Changed(Set.of(recipient.getId()), 91));
                status.setRollbackOnly();
            });
            assertThat(stream.getResponse().getContentAsString()).doesNotContain("event:chat");
            long id = open(sender, recipient, CLIENT_IDS.incrementAndGet());
            assertThat(stream.getResponse().getContentAsString()).contains("event:chat-message", "data:" + id);
            stream.getRequest().getAsyncContext().complete();
            var reconnect = mvc.perform(get("/chat/events").cookie(cookie))
                    .andExpect(content().string(org.hamcrest.Matchers.containsString("event:ready"))).andReturn();
            reconnect.getRequest().getAsyncContext().complete();
            mvc.perform(get("/chat").cookie(cookie)).andExpect(jsonPath("$[0].id").value(id));
        } finally {
            if (stream.getRequest().isAsyncStarted()) stream.getRequest().getAsyncContext().complete();
        }
    }

    private Cookie accessCookie(User user) {
        Instant now = Instant.now();
        var session = sessions.save(AuthSession.builder().id(UUID.randomUUID().toString()).user(user)
                .deviceName("Integration test").createdAt(now).lastActiveAt(now).expiresAt(now.plusSeconds(3600)).build());
        return new Cookie("access_token", tokens.createAccessToken(user.getUsername(), user, session.getId()));
    }

    private long open(User sender, User recipient, long key) throws Exception {
        var result = mvc.perform(body(post("/chat/requests").with(as(sender)), openBody(recipient, key)))
                .andExpect(status().isOk()).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).path("id").asLong();
    }

    private String openBody(User recipient, long key) {
        return json.writeValueAsString(Map.of("username", recipient.getUsername(), "text", "hello", "clientId", key));
    }

    private String sendBody(long key) {
        return json.writeValueAsString(Map.of("text", "follow-up", "clientId", key));
    }
}

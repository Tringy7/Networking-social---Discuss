package com.discuss.discuss.service.chat;

import com.discuss.discuss.dto.chat.ChatThreadResponseDTO;
import com.discuss.discuss.entity.ChatRequest;
import com.discuss.discuss.entity.Conversation;
import com.discuss.discuss.entity.ConversationMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.exception.chat.ChatErrorCode;
import com.discuss.discuss.exception.chat.ChatException;
import com.discuss.discuss.repository.chat.ChatRequestRepository;
import com.discuss.discuss.repository.chat.ConversationMemberRepository;
import com.discuss.discuss.repository.chat.ConversationRepository;
import com.discuss.discuss.service.notification.NotificationEvents;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatRequestService {
    private final ConversationRepository conversations;
    private final ConversationMemberRepository members;
    private final ChatRequestRepository requests;
    private final ChatMessageService messageService;
    private final UserService users;
    private final ChatRateLimit rateLimit;
    private final NotificationEvents notifications;
    private final ChatAccess access;
    private final ChatChangePublisher changes;
    private final ChatConversationService conversationService;
    private final ChatMessageStore messageStore;
    private final ChatPrivacyService privacyService;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ChatThreadResponseDTO openConversationAndSendMessage(String username, String text, Long clientId) {
        long actorId = users.getCurrentUser().getId();
        User peer = users.getActiveByUsername(username);
        long peerId = peer.getId();
        if (actorId == peerId) {
            throw new ChatException(ChatErrorCode.CANNOT_MESSAGE_SELF);
        }
        access.lockPair(actorId, peerId);
        access.requirePairNotBlocked(actorId, peerId);

        String key = ChatAccess.directKey(actorId, peerId);
        var existing = conversations.findByDirectKey(key);
        if (existing.isPresent()) {
            return sendToExistingConversation(existing.get().getId(), actorId, text, clientId);
        }
        return createDirectConversation(key, actorId, peer, text, clientId);
    }

    private ChatThreadResponseDTO sendToExistingConversation(long id, long actorId, String text, Long clientId) {
        messageService.sendMessage(id, text, clientId, null, List.of());
        return conversationService.buildConversationResponse(access.requireConversationMember(id, actorId), access.requireChatRequest(id));
    }

    private ChatThreadResponseDTO createDirectConversation(String key, long actorId, User peer, String text, Long clientId) {
        rateLimit.acquire(actorId, "requests", 10);
        if (!privacyService.allowsNewConversations(peer)) {
            throw new ChatException(ChatErrorCode.MESSAGING_UNAVAILABLE);
        }
        long peerId = peer.getId();
        var conversation = new Conversation();
        conversation.setKind(Conversation.Kind.DIRECT);
        conversation.setDirectKey(key);
        long id = conversations.save(conversation).getId();

        var membership = addMember(id, actorId);
        addMember(id, peerId);

        var request = new ChatRequest();
        request.setConversationId(id);
        request.setSenderId(actorId);
        request.setRecipientId(peerId);
        request.setStatus(ChatRequest.Status.ACCEPTED);
        requests.save(request);
        messageStore.insert(id, actorId, text, clientId);
        notifications.enqueueChatNotification(actorId, peerId, false);
        changes.changed(request);
        return conversationService.buildConversationResponse(membership, request);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ChatThreadResponseDTO decidePendingChatRequest(long id, ChatRequest.Status decision) {
        long actor = users.getCurrentUser().getId();
        var membership = access.requireConversationMember(id, actor);
        var request = access.lockConversationParticipants(id);
        access.requirePairNotBlocked(request.getSenderId(), request.getRecipientId());
        validateRequestDecision(request, actor, decision);
        request.setStatus(decision);
        changes.changed(request);
        return conversationService.buildConversationResponse(membership, request);
    }

    public static void validateRequestDecision(ChatRequest request, long actor, ChatRequest.Status decision) {
        boolean permitted = switch (decision) {
            case WITHDRAWN -> request.getSenderId().equals(actor);
            case ACCEPTED, REJECTED -> request.getRecipientId().equals(actor);
            case PENDING -> false;
        };
        if (!permitted) {
            throw new ChatException(ChatErrorCode.REQUEST_ACTION_FORBIDDEN);
        }
        if (request.getStatus() != ChatRequest.Status.PENDING) {
            throw new ChatException(ChatErrorCode.REQUEST_NOT_PENDING);
        }
    }

    private ConversationMember addMember(long id, long user) {
        var membership = new ConversationMember();
        membership.setConversationId(id);
        membership.setUserId(user);
        return members.save(membership);
    }
}

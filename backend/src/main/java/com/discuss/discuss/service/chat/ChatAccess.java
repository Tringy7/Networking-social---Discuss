package com.discuss.discuss.service.chat;

import com.discuss.discuss.entity.ChatRequest;
import com.discuss.discuss.entity.ConversationMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.exception.chat.ChatErrorCode;
import com.discuss.discuss.exception.chat.ChatException;
import com.discuss.discuss.repository.chat.ChatRequestRepository;
import com.discuss.discuss.repository.chat.ConversationMemberRepository;
import com.discuss.discuss.repository.chat.UserBlockRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class ChatAccess {
    private final ConversationMemberRepository members;
    private final ChatRequestRepository requests;
    private final UserBlockRepository blocks;
    private final EntityManager entities;

    public static void requireAcceptedConversation(ChatRequest request, ChatErrorCode chatErrorCode) {
    }

    public ChatRequest lockConversationParticipants(long id) {
        var request = requireChatRequest(id);
        lockPair(request.getSenderId(), request.getRecipientId());
        entities.refresh(request);
        return request;
    }

    public ChatRequest lockConversationForMember(long conversationId, long userId) {
        var membership = requireConversationMember(conversationId, userId);
        var request = lockConversationParticipants(conversationId);
        entities.refresh(membership);
        return request;
    }

    public ConversationMember requirePeerMembership(ChatRequest request, long userId) {
        return requireConversationMember(request.getConversationId(), getPeerUserId(request, userId));
    }

    public void lockPair(long first, long second) {
        lockActiveUser(Math.min(first, second));
        lockActiveUser(Math.max(first, second));
    }

    public void lockActiveUser(long id) {
        var user = entities.find(User.class, id, LockModeType.PESSIMISTIC_WRITE);
        if (user != null) {
            entities.refresh(user);
        }
        if (user == null || user.getStatus() != UserStatus.ACTIVE) {
            throw new ChatException(ChatErrorCode.PARTICIPANT_NOT_FOUND);
        }
    }

    public static String directKey(long first, long second) {
        return Math.min(first, second) + ":" + Math.max(first, second);
    }

    public void requirePairNotBlocked(long first, long second) {
        if (isPairBlocked(first, second)) {
            throw new ChatException(ChatErrorCode.MESSAGING_UNAVAILABLE);
        }
    }

    public boolean isPairBlocked(long first, long second) {
        return blocks.findByBlockerIdAndBlockedId(first, second).isPresent()
                || blocks.findByBlockerIdAndBlockedId(second, first).isPresent();
    }

    public ConversationMember requireConversationMember(long id, long actor) {
        return members.findByConversationIdAndUserId(id, actor)
                .orElseThrow(() -> new ChatException(ChatErrorCode.CONVERSATION_NOT_FOUND));
    }

    public ChatRequest requireChatRequest(long id) {
        return requests.findByConversationId(id)
                .orElseThrow(() -> new ChatException(ChatErrorCode.CONVERSATION_NOT_FOUND));
    }

    public static long getPeerUserId(ChatRequest request, long actor) {
        return request.getRecipientId().equals(actor) ? request.getSenderId() : request.getRecipientId();
    }

    public static long getLastReadMessageId(ConversationMember membership) {
        return membership.getReadThrough() == null ? 0 : membership.getReadThrough();
    }

}

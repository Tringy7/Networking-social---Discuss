package com.discuss.discuss.service.chat;

import com.discuss.discuss.dto.chat.ChatThreadResponseDTO;
import com.discuss.discuss.entity.ChatRequest;
import com.discuss.discuss.entity.ConversationMember;
import com.discuss.discuss.mapper.chat.ChatMapper;
import com.discuss.discuss.repository.chat.ConversationMemberRepository;
import com.discuss.discuss.repository.chat.MessageRepository;
import com.discuss.discuss.repository.chat.UserBlockRepository;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatConversationService {
    private final ChatMessageStore messageStore;
    private final ChatMapper mapper;
    private final ConversationMemberRepository members;
    private final MessageRepository messages;
    private final UserBlockRepository blocks;
    private final UserService users;
    private final ChatUpdates updates;
    private final ChatAccess access;
    private final ChatChangePublisher changes;

    public List<ChatThreadResponseDTO> listConversations() {
        long actor = users.getCurrentUser().getId();
        return members.findByUserId(actor).stream()
                .map(member -> buildConversationResponse(member, access.requireChatRequest(member.getConversationId())))
                .sorted(Comparator.comparing(ChatThreadResponseDTO::isPinned).reversed()
                        .thenComparing(ChatThreadResponseDTO::getId, Comparator.reverseOrder()))
                .toList();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void markConversationAsRead(long id, long through) {
        long actor = users.getCurrentUser().getId();
        var request = access.lockConversationForMember(id, actor);
        var membership = access.requireConversationMember(id, actor);
        messageStore.findMessage(id, through);
        if (through > ChatAccess.getLastReadMessageId(membership)) {
            membership.setReadThrough(through);
            changes.changed(request);
        }
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ChatThreadResponseDTO updateConversationPreferences(long id, Boolean pinned, Boolean hidden, Boolean muted) {
        long actor = users.getCurrentUser().getId();
        var request = access.lockConversationForMember(id, actor);
        var membership = access.requireConversationMember(id, actor);
        if (pinned != null) {
            membership.setPinned(pinned);
        }
        if (hidden != null) {
            membership.setHidden(hidden);
        }
        if (muted != null) {
            membership.setMuted(muted);
        }
        changes.changed(actor, id);
        return buildConversationResponse(membership, request);
    }

    public ChatThreadResponseDTO buildConversationResponse(ConversationMember membership, ChatRequest request) {
        long actor = membership.getUserId();
        boolean incoming = request.getRecipientId().equals(actor);
        long peer = incoming ? request.getSenderId() : request.getRecipientId();
        boolean blocked = access.isPairBlocked(actor, peer);
        return mapper.toThread(membership, request, users.getById(peer).getUsername(),
                incoming, blocked, blocks.findByBlockerIdAndBlockedId(actor, peer).isPresent(),
                !blocked && request.getConversationStatus() == ChatRequest.Status.ACCEPTED && updates.online(peer),
                messages.countUnread(membership.getConversationId(), actor, ChatAccess.getLastReadMessageId(membership)));
    }
}

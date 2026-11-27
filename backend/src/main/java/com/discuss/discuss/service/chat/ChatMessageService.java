package com.discuss.discuss.service.chat;

import com.discuss.discuss.dto.chat.ChatMessageResponseDTO;
import com.discuss.discuss.entity.Message;
import com.discuss.discuss.entity.MessageAttachment;
import com.discuss.discuss.entity.MessageReaction;
import com.discuss.discuss.exception.chat.ChatErrorCode;
import com.discuss.discuss.exception.chat.ChatException;
import com.discuss.discuss.mapper.chat.ChatMapper;
import com.discuss.discuss.repository.chat.MessageAttachmentRepository;
import com.discuss.discuss.repository.chat.MessageReactionRepository;
import com.discuss.discuss.repository.chat.MessageRepository;
import com.discuss.discuss.service.notification.NotificationEvents;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatMessageService {
    private static final int HISTORY_PAGE_SIZE = 30;
    private static final int MAX_ATTACHMENTS = 4;
    private static final long MAX_ATTACHMENT_BYTES = 10L * 1024 * 1024;

    private final ChatMapper mapper;
    private final MessageRepository messages;
    private final UserService users;
    private final ChatRateLimit rateLimit;
    private final MessageAttachmentRepository attachments;
    private final MessageReactionRepository reactions;
    private final NotificationEvents notifications;
    private final ChatAccess access;
    private final ChatAttachmentService attachmentService;
    private final ChatChangePublisher changes;
    private final ChatMessageStore messageStore;

    public List<ChatMessageResponseDTO> getMessageHistory(long conversationId, long beforeMessageId) {
        long viewerId = users.getCurrentUser().getId();
        access.requireConversationMember(conversationId, viewerId);
        var request = access.requireChatRequest(conversationId);
        long peerLastReadId = ChatAccess.getLastReadMessageId(access.requirePeerMembership(request, viewerId));

        var page = messages.findByConversationIdAndIdLessThanOrderByIdDesc(
                conversationId, beforeMessageId, PageRequest.of(0, HISTORY_PAGE_SIZE));
        if (page.isEmpty()) {
            return List.of();
        }

        var messageIds = page.stream().map(Message::getId).toList();
        var attachmentsByMessage = attachments.findByMessageIdInOrderById(messageIds).stream()
                .collect(Collectors.groupingBy(MessageAttachment::getMessageId));
        var reactionsByMessage = reactions.findByMessageIdInOrderById(messageIds).stream()
                .collect(Collectors.groupingBy(MessageReaction::getMessageId));

        return page.stream()
                .map(message -> mapper.toMessage(
                        message, viewerId, peerLastReadId,
                        attachmentsByMessage.getOrDefault(message.getId(), List.of()),
                        reactionsByMessage.getOrDefault(message.getId(), List.of())))
                .toList();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ChatMessageResponseDTO sendMessage(long id, String text, Long clientId, Long replyToId, List<MultipartFile> files) {
        long actor = users.getCurrentUser().getId();
        var request = access.lockConversationForMember(id, actor);
        access.requirePairNotBlocked(request.getSenderId(), request.getRecipientId());
        ChatAccess.requireAcceptedConversation(request, ChatErrorCode.REQUEST_REQUIRED_TO_SEND);
        var existing = messages.findByConversationIdAndSenderIdAndClientId(id, actor, clientId.toString());
        if (existing.isPresent()) {
            return mapper.toMessage(existing.get(), actor, ChatAccess.getLastReadMessageId(access.requirePeerMembership(request, actor)),
                    attachments.findByMessageIdInOrderById(List.of(existing.get().getId())),
                    reactions.findByMessageIdInOrderById(List.of(existing.get().getId())));
        }
        rateLimit.acquire(actor, "messages", 60);
        validateOutgoingMessage(id, actor, text, replyToId, files);

        var message = messageStore.insert(id, actor, text, clientId);
        message.setReplyToId(replyToId);
        var uploaded = files.stream().map(file -> attachmentService.storeAttachment(message.getId(), file)).toList();
        var recipient = access.requirePeerMembership(request, actor);
        if (!recipient.isMuted()) {
            notifications.chatReceived(actor, recipient.getUserId(), false);
        }
        changes.changed(request);
        return mapper.toMessage(message, actor, 0, uploaded, List.of());
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void editMessage(long id, long messageId, String text) {
        var message = requireOwnedMessage(id, messageId);
        requireEditableMessage(message);
        message.setBody(text.strip());
        message.setEditedAt(Instant.now());
        changes.changed(access.requireChatRequest(id));
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void recallMessage(long id, long messageId) {
        var message = requireOwnedMessage(id, messageId);
        if (message.getRecalledAt() == null) {
            message.setRecalledAt(Instant.now());
            changes.changed(access.requireChatRequest(id));
        }
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void hideMessageForCurrentUser(long id, long messageId) {
        long actor = users.getCurrentUser().getId();
        access.lockConversationForMember(id, actor);
        var message = messageStore.findMessage(id, messageId);
        if (message.getHiddenFor().add(actor)) {
            changes.changed(actor, id);
        }
    }

    private void validateOutgoingMessage(long conversationId, long senderId, String text,
                                         Long replyToId, List<MultipartFile> files) {
        if (files.size() > MAX_ATTACHMENTS
                || files.stream().anyMatch(file -> file.isEmpty() || file.getSize() > MAX_ATTACHMENT_BYTES)) {
            throw new ChatException(ChatErrorCode.INVALID_ATTACHMENTS);
        }
        if (text.isBlank() && files.isEmpty()) {
            throw new ChatException(ChatErrorCode.EMPTY_MESSAGE);
        }
        if (replyToId != null) {
            messageStore.requireVisibleMessage(conversationId, replyToId, senderId);
        }
    }

    private void requireEditableMessage(Message message) {
        if (message.getRecalledAt() != null || ChatMessageStore.hidden(message, message.getSenderId())) {
            throw new ChatException(ChatErrorCode.MESSAGE_UNAVAILABLE);
        }
    }

    private Message requireOwnedMessage(long id, long messageId) {
        long actor = users.getCurrentUser().getId();
        var request = access.lockConversationForMember(id, actor);
        ChatAccess.requireAcceptedConversation(request, ChatErrorCode.REQUEST_NOT_ACCEPTED);
        var message = messageStore.findMessage(id, messageId);
        if (!message.getSenderId().equals(actor)) {
            throw new ChatException(ChatErrorCode.MESSAGE_OWNER_REQUIRED);
        }
        return message;
    }

}

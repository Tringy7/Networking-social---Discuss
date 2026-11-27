package com.discuss.discuss.mapper.chat;

import com.discuss.discuss.dto.chat.ChatAttachmentResponseDTO;
import com.discuss.discuss.dto.chat.ChatMessageResponseDTO;
import com.discuss.discuss.dto.chat.ChatReactionResponseDTO;
import com.discuss.discuss.dto.chat.ChatReportEvidenceDTO;
import com.discuss.discuss.dto.chat.ChatThreadResponseDTO;
import com.discuss.discuss.entity.ChatRequest;
import com.discuss.discuss.entity.ConversationMember;
import com.discuss.discuss.entity.Message;
import com.discuss.discuss.entity.MessageAttachment;
import com.discuss.discuss.entity.MessageReaction;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Mapper(componentModel = "spring")
public interface ChatMapper {
    @Mapping(target = "id", source = "membership.conversationId")
    @Mapping(target = "status", source = "request.conversationStatus")
    ChatThreadResponseDTO toThread(ConversationMember membership, ChatRequest request, String peer,
                                   boolean incoming, boolean blocked, boolean blockedByMe, boolean online, long unread);

    default ChatMessageResponseDTO toMessage(Message message, long actor, long readByPeer,
                                             List<MessageAttachment> attachments, List<MessageReaction> reactions) {
        boolean mine = message.getSenderId().equals(actor);
        boolean recalled = message.getRecalledAt() != null;
        boolean hidden = message.getHiddenFor().contains(actor);
        boolean contentVisible = !hidden && !recalled;

        return toMessageResponse(message, mine, recalled && !hidden, mine && message.getId() <= readByPeer,
                contentVisible ? message.getBody() : null,
                hidden ? null : message.getReplyToId(),
                hidden ? null : message.getEditedAt(),
                contentVisible ? attachments.stream().map(this::toAttachment).toList() : List.of(),
                contentVisible ? reactions.stream().map(reaction -> toReaction(reaction, reaction.getUserId().equals(actor))).toList()
                        : List.of());
    }

    @Mapping(target = "id", source = "message.id")
    ChatMessageResponseDTO toMessageResponse(Message message, boolean mine, boolean recalled, boolean read,
                                              String text, Long replyToId, java.time.Instant editedAt,
                                              List<ChatAttachmentResponseDTO> attachments, List<ChatReactionResponseDTO> reactions);

    ChatAttachmentResponseDTO toAttachment(MessageAttachment attachment);

    ChatReactionResponseDTO toReaction(MessageReaction reaction, boolean mine);

    @Mapping(target = "text", source = "message.body")
    ChatReportEvidenceDTO toReportEvidence(Message message, String senderUsername, int attachmentCount);
}

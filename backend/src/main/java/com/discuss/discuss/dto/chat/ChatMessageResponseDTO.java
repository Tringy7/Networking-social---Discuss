package com.discuss.discuss.dto.chat;

import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponseDTO {
    private Long id;
    private boolean mine;
    private String text;
    private Instant createdAt;
    private Long replyToId;
    private Instant editedAt;
    private boolean recalled;
    private boolean read;
    private List<ChatAttachmentResponseDTO> attachments;
    private List<ChatReactionResponseDTO> reactions;
}

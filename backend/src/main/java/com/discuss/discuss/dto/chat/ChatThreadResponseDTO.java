package com.discuss.discuss.dto.chat;

import com.discuss.discuss.entity.ChatRequest;
import lombok.AllArgsConstructor;
import java.time.Instant;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatThreadResponseDTO {
    private Long id;
    private String peer;
    private ChatRequest.Status status;
    private boolean incoming;
    private boolean blocked;
    private boolean blockedByMe;
    private boolean online;
    private long unread;
    private boolean pinned;
    private boolean hidden;
    private boolean muted;
    private long peerReadThrough;
    private Preview preview;

    public record Preview(boolean mine, String text, boolean recalled, Instant createdAt) {}
}

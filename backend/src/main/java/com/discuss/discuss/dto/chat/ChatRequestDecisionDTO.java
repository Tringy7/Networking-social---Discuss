package com.discuss.discuss.dto.chat;

import com.discuss.discuss.entity.ChatRequest;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChatRequestDecisionDTO {
    @NotNull
    private ChatRequest.Status status;
}

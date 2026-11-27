package com.discuss.discuss.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendChatMessageRequestDTO {
    @NotBlank
    @Size(max = 4000)
    private String text;

    @NotNull
    private Long clientId;

    @Positive
    private Long replyToId;
}

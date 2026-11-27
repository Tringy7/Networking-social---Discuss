package com.discuss.discuss.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EditChatMessageRequestDTO {
    @NotBlank
    @Size(max = 4000)
    private String text;
}

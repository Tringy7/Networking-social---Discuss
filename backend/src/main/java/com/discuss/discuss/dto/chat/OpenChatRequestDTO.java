package com.discuss.discuss.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpenChatRequestDTO {
    @NotBlank
    @Size(max = 100)
    private String username;

    @NotBlank
    @Size(max = 4000)
    private String text;

    @NotNull
    private Long clientId;
}

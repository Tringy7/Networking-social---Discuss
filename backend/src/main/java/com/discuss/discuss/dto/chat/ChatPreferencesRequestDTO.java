package com.discuss.discuss.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatPreferencesRequestDTO {
    private Boolean pinned;
    private Boolean hidden;
    private Boolean muted;
}

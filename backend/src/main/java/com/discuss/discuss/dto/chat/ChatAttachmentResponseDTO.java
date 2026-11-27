package com.discuss.discuss.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatAttachmentResponseDTO {
    private Long id;
    private String filename;
    private String contentType;
}

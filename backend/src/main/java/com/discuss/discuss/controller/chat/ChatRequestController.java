package com.discuss.discuss.controller.chat;

import com.discuss.discuss.dto.chat.ChatThreadResponseDTO;
import com.discuss.discuss.dto.chat.ChatRequestDecisionDTO;
import com.discuss.discuss.dto.chat.OpenChatRequestDTO;
import com.discuss.discuss.service.chat.ChatRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatRequestController {
    private final ChatRequestService chat;

    @PostMapping("/requests")
    public ResponseEntity<ChatThreadResponseDTO> openConversationAndSendMessage(@Valid @RequestBody OpenChatRequestDTO body) {
        return ResponseEntity.ok(chat.openConversationAndSendMessage(body.getUsername(), body.getText(), body.getClientId()));
    }

    @PatchMapping("/{id}/request")
    public ResponseEntity<ChatThreadResponseDTO> decidePendingChatRequest(@PathVariable long id, @Valid @RequestBody ChatRequestDecisionDTO body) {
        return ResponseEntity.ok(chat.decidePendingChatRequest(id, body.getStatus()));
    }
}

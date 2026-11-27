package com.discuss.discuss.controller.chat;

import com.discuss.discuss.dto.chat.ChatPreferencesRequestDTO;
import com.discuss.discuss.dto.chat.ChatReadRequestDTO;
import com.discuss.discuss.dto.chat.ChatThreadResponseDTO;
import com.discuss.discuss.service.chat.ChatConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatConversationController {
    private final ChatConversationService chat;

    @GetMapping
    public ResponseEntity<List<ChatThreadResponseDTO>> listConversations() { return ResponseEntity.ok(chat.listConversations()); }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markConversationAsRead(@PathVariable long id, @Valid @RequestBody ChatReadRequestDTO body) {
        chat.markConversationAsRead(id, body.getThrough());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/preferences")
    public ResponseEntity<ChatThreadResponseDTO> updateConversationPreferences(@PathVariable long id, @RequestBody ChatPreferencesRequestDTO body) {
        return ResponseEntity.ok(chat.updateConversationPreferences(id, body.getPinned(), body.getHidden(), body.getMuted()));
    }
}

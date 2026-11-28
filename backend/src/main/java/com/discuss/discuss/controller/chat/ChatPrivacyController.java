package com.discuss.discuss.controller.chat;

import com.discuss.discuss.dto.chat.ChatPrivacyDTO;
import com.discuss.discuss.service.chat.ChatPrivacyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class
ChatPrivacyController {
    private final ChatPrivacyService chat;

    @GetMapping("/privacy")
    public ResponseEntity<ChatPrivacyDTO> getChatPrivacySettings() { return ResponseEntity.ok(new ChatPrivacyDTO(chat.allowsNewConversations())); }

    @PutMapping("/privacy")
    public ResponseEntity<Void> updateChatPrivacySettings(@Valid @RequestBody ChatPrivacyDTO body) {
        chat.updateIncomingChatPreference(body.getAllowRequests());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/blocks/{username}")
    public ResponseEntity<Void> blockUserForChat(@PathVariable String username) {
        chat.setUserBlocked(username, true);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/blocks/{username}")
    public ResponseEntity<Void> unblockUserForChat(@PathVariable String username) {
        chat.setUserBlocked(username, false);
        return ResponseEntity.noContent().build();
    }
}

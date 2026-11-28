package com.discuss.discuss.controller.chat;

import com.discuss.discuss.dto.chat.ChatMessageResponseDTO;
import com.discuss.discuss.dto.chat.ChatReactionRequestDTO;
import com.discuss.discuss.dto.chat.EditChatMessageRequestDTO;
import com.discuss.discuss.dto.chat.SendChatMessageRequestDTO;
import com.discuss.discuss.service.chat.ChatMessageService;
import com.discuss.discuss.service.chat.ChatAttachmentService;
import com.discuss.discuss.service.chat.ChatReactionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatMessageController {
    private final ChatMessageService chat;
    private final ChatAttachmentService attachments;
    private final ChatReactionService reactions;

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<ChatMessageResponseDTO>> getMessageHistory(
            @PathVariable long id,
            @RequestParam(defaultValue = "9223372036854775807") @Positive Long before) {
        return ResponseEntity.ok(chat.getMessageHistory(id, before));
    }

    @PostMapping(value = "/{id}/messages", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ChatMessageResponseDTO> sendTextMessage(
            @PathVariable long id,
            @Valid @RequestBody SendChatMessageRequestDTO body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                chat.sendMessage(id,
                        body.getText(),
                        body.getClientId(),
                        body.getReplyToId(),
                        List.of()));
    }

    @PostMapping(value = "/{id}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatMessageResponseDTO> sendMessageWithAttachments(@PathVariable long id,
            @RequestParam(defaultValue = "") @Size(max = 4000) String text, @RequestParam Long clientId,
            @RequestParam(required = false) @Positive Long replyToId, @RequestParam List<MultipartFile> files) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chat.sendMessage(id, text, clientId, replyToId, files));
    }

    @GetMapping("/{id}/messages/{messageId}/attachments/{attachmentId}")
    public ResponseEntity<Void> redirectToMessageAttachment(@PathVariable long id, @PathVariable long messageId, @PathVariable long attachmentId) {
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(attachments.getMessageAttachmentUrl(id, messageId, attachmentId)))
                .header("Cache-Control", "private, no-store").build();
    }

    @PutMapping("/{id}/messages/{messageId}/reaction")
    public ResponseEntity<Void> setMessageReaction(@PathVariable long id, @PathVariable long messageId, @Valid @RequestBody ChatReactionRequestDTO body) {
        reactions.updateMessageReaction(id, messageId, body.getEmoji());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/messages/{messageId}/reaction")
    public ResponseEntity<Void> removeMessageReaction(@PathVariable long id, @PathVariable long messageId) {
        reactions.updateMessageReaction(id, messageId, null);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/messages/{messageId}")
    public ResponseEntity<Void> editMessage(@PathVariable long id, @PathVariable long messageId, @Valid @RequestBody EditChatMessageRequestDTO body) {
        chat.editMessage(id, messageId, body.getText());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/messages/{messageId}")
    public ResponseEntity<Void> hideMessageForCurrentUser(@PathVariable long id, @PathVariable long messageId) {
        chat.hideMessageForCurrentUser(id, messageId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/messages/{messageId}/content")
    public ResponseEntity<Void> recallMessageForEveryone(@PathVariable long id, @PathVariable long messageId) {
        chat.recallMessage(id, messageId);
        return ResponseEntity.noContent().build();
    }
}

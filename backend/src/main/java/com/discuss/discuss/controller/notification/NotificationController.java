package com.discuss.discuss.controller.notification;

import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.notification.NotificationResponseDTO;
import com.discuss.discuss.service.notification.NotificationService;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public PageResponseDTO<NotificationResponseDTO> list(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @PageableDefault(size = 10) Pageable pageable) {
        return notificationService.list(unreadOnly, pageable);
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount() {
        return new UnreadCountResponse(notificationService.unreadCount());
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse> markRead(@PathVariable @Positive Long notificationId) {
        if (!notificationService.markRead(notificationId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse("Notification not found"));
        }
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead() {
        notificationService.markAllRead();
    }

    public record UnreadCountResponse(long unreadCount) {}
}

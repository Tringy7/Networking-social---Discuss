package com.discuss.discuss.controller.notification;

import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.notification.NotificationResponseDTO;
import com.discuss.discuss.service.notification.NotificationService;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import java.time.LocalDateTime;
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

    public record UnreadCountResponse(long unreadCount, long totalCount, Long latestId, LocalDateTime lastReadAt) {}

    @GetMapping
    public ResponseEntity<PageResponseDTO<NotificationResponseDTO>> getCurrentUserNotifications(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(notificationService.getCurrentUserNotifications(unreadOnly, pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> countCurrentUserUnreadNotifications() {
        var summary = notificationService.getCurrentUserNotificationSummary();
        Long unread = summary.getUnreadCount();
        return ResponseEntity.ok(new UnreadCountResponse(unread == null ? 0 : unread,
                summary.getTotalCount(), summary.getLatestId(), summary.getLastReadAt()));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse> markNotificationAsRead(@PathVariable @Positive Long notificationId) {
        if (!notificationService.markNotificationAsRead(notificationId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse("Notification not found"));
        }
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllNotificationsAsRead() {
        notificationService.markAllNotificationsAsRead();
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/read")
    public ResponseEntity<Void> deleteCurrentUserReadNotifications() {
        notificationService.deleteCurrentUserReadNotifications();
        return ResponseEntity.noContent().build();
    }
}

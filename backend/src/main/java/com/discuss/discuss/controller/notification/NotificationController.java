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

    public record UnreadCountResponse(long unreadCount) {}

    /**
     * Lấy thông báo của tài khoản đang đăng nhập theo thứ tự mới nhất trước.
     *
     * @param unreadOnly {@code true} để chỉ lấy thông báo chưa đọc, mặc định là {@code false}.
     * @param pageable thông tin phân trang, mặc định 10 thông báo mỗi trang.
     * @return {@code 200 OK} với một trang {@link NotificationResponseDTO}.
     */
    @GetMapping
    public ResponseEntity<PageResponseDTO<NotificationResponseDTO>> getCurrentUserNotifications(
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(notificationService.getCurrentUserNotifications(unreadOnly, pageable));
    }

    /**
     * Đếm thông báo chưa đọc của tài khoản đang đăng nhập để hiển thị trên chuông.
     *
     * @return {@code 200 OK} với {@link UnreadCountResponse} chứa số thông báo chưa đọc.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> countCurrentUserUnreadNotifications() {
        return ResponseEntity.ok(new UnreadCountResponse(notificationService.countCurrentUserUnreadNotifications()));
    }

    /**
     * Đánh dấu một thông báo của tài khoản đang đăng nhập là đã đọc.
     *
     * @param notificationId ID dương của thông báo cần đánh dấu.
     * @return {@code 204 No Content} nếu thông báo đã được đánh dấu hoặc đã đọc từ trước.
     *         Trả {@code 404 Not Found} với {@link ApiResponse} nếu không tìm thấy thông báo
     *         của tài khoản hiện tại theo ID đã cho.
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse> markNotificationAsRead(@PathVariable @Positive Long notificationId) {
        if (!notificationService.markNotificationAsRead(notificationId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse("Notification not found"));
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * Đánh dấu toàn bộ thông báo chưa đọc của tài khoản đang đăng nhập là đã đọc.
     *
     * @return {@code 204 No Content}, kể cả khi không có thông báo chưa đọc.
     */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllNotificationsAsRead() {
        notificationService.markAllNotificationsAsRead();
        return ResponseEntity.noContent().build();
    }

    /**
     * Xóa các thông báo đã đọc của tài khoản đang đăng nhập.
     *
     * @return {@code 204 No Content} sau khi xử lý yêu cầu.
     */
    @DeleteMapping("/read")
    public ResponseEntity<Void> deleteCurrentUserReadNotifications() {
        notificationService.deleteCurrentUserReadNotifications();
        return ResponseEntity.noContent().build();
    }
}

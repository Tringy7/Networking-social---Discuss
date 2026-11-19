package com.discuss.discuss.controller.notification;

import com.discuss.discuss.service.notification.CommunityNotificationPreferenceService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/communities/{name}/notification-preferences")
@RequiredArgsConstructor
public class CommunityNotificationPreferenceController {
    private final CommunityNotificationPreferenceService preferences;

    public record PreferenceRequest(@NotNull Boolean newPostEnabled) {}
    public record PreferenceResponse(boolean newPostEnabled) {}

    /**
     * Lấy tùy chọn nhận thông báo bài mới của thành viên đang hoạt động trong cộng đồng.
     * Thông báo bài mới được bật mặc định nếu thành viên chưa lưu tùy chọn.
     *
     * @param name tên định danh của cộng đồng.
     * @return {@code 200 OK} với {@link PreferenceResponse} chứa tùy chọn hiện tại.
     */
    @GetMapping
    public ResponseEntity<PreferenceResponse> get(@PathVariable String name) {
        return ResponseEntity.ok(new PreferenceResponse(preferences.isNewPostEnabled(name)));
    }

    /**
     * Bật hoặc tắt thông báo bài mới cho thành viên đang hoạt động trong cộng đồng.
     *
     * @param name tên định danh của cộng đồng.
     * @param request yêu cầu chứa {@code newPostEnabled} kiểu boolean. Ví dụ
     *                {@code {"newPostEnabled":false}} để tắt thông báo bài mới.
     * @return {@code 200 OK} với {@link PreferenceResponse} chứa tùy chọn đã lưu.
     */
    @PutMapping
    public ResponseEntity<PreferenceResponse> update(@PathVariable String name, @Valid @RequestBody PreferenceRequest request) {
        preferences.update(name, request.newPostEnabled());
        return ResponseEntity.ok(new PreferenceResponse(request.newPostEnabled()));
    }

}

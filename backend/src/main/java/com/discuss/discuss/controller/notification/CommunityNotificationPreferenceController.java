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

    @GetMapping
    public ResponseEntity<PreferenceResponse> getCommunityNotificationPreference(@PathVariable String name) {
        return ResponseEntity.ok(new PreferenceResponse(preferences.isNewPostNotificationEnabled(name)));
    }

    @PutMapping
    public ResponseEntity<PreferenceResponse> updateCommunityNotificationPreference(@PathVariable String name, @Valid @RequestBody PreferenceRequest request) {
        preferences.updateNewPostNotificationPreference(name, request.newPostEnabled());
        return ResponseEntity.ok(new PreferenceResponse(request.newPostEnabled()));
    }

}

package com.discuss.discuss.controller.user;

import com.discuss.discuss.dto.user.PublicUserProfileResponseDTO;
import com.discuss.discuss.dto.user.UpdateProfileRequestDTO;
import com.discuss.discuss.dto.user.UserInfoResponseDTO;
import com.discuss.discuss.service.user.UserProfileService;
import com.discuss.discuss.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final UserProfileService userProfileService;

    @GetMapping("/me")
    public ResponseEntity<UserInfoResponseDTO> getUserInfo() {
        return ResponseEntity.ok().body(this.userProfileService.getUserProfile());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<PublicUserProfileResponseDTO> getPublicUserProfile(@PathVariable Long userId ) {
        return ResponseEntity.ok( userProfileService.getPublicUserProfile(userId) );
    }

    @PatchMapping("/me/profile")
    public ResponseEntity<UserInfoResponseDTO> editUserInfo(
            @Valid @RequestBody UpdateProfileRequestDTO request
    ) {
        return ResponseEntity.ok(userProfileService.updateProfile(request));
    }
}

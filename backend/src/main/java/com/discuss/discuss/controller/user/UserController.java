package com.discuss.discuss.controller.user;

import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.dto.user.PublicUserProfileResponseDTO;
import com.discuss.discuss.dto.user.UpdateProfileRequestDTO;
import com.discuss.discuss.dto.user.UserInfoResponseDTO;
import com.discuss.discuss.service.media.ProfileImageService;
import com.discuss.discuss.service.user.UserProfileService;
import com.discuss.discuss.service.user.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserProfileService userProfileService;

    private final ProfileImageService profileImageService;


    @GetMapping("/me")
    public ResponseEntity<UserInfoResponseDTO> getUserInfo() {
        return ResponseEntity.ok().body(this.userProfileService.getUserProfile());
    }

    @PutMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StoredImageDTO setAvatar(
            @RequestParam("file") MultipartFile file) {
        return profileImageService.setAvatar(file);
    }

    // New banner, edit banner
    @PutMapping(value = "/me/banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StoredImageDTO setBanner(
            @RequestParam("file") MultipartFile file) {
        return profileImageService.setBanner(file);
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

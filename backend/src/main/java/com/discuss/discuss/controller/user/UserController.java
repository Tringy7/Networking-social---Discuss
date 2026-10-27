package com.discuss.discuss.controller.user;

import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.dto.user.PublicUserProfileResponseDTO;
import com.discuss.discuss.dto.user.UpdateProfileRequestDTO;
import com.discuss.discuss.dto.user.UserInfoResponseDTO;
import com.discuss.discuss.dto.user.UserSearchResultDTO;
import com.discuss.discuss.service.media.ImageService;
import com.discuss.discuss.service.user.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserProfileService userProfileService;

    private final ImageService imageService;


    @GetMapping("/me")
    public ResponseEntity<UserInfoResponseDTO> getUserInfo() {
        return ResponseEntity.ok().body(this.userProfileService.getUserProfile());
    }

    @PutMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserInfoResponseDTO> setAvatar(
            @RequestParam("file") MultipartFile file) {
        imageService.setAvatarForUser(file);
        return ResponseEntity.ok().body(this.userProfileService.getUserProfile()); 
    }

    // New banner, edit banner
    @PutMapping(value = "/me/banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserInfoResponseDTO> setBanner(
            @RequestParam("file") MultipartFile file) {
        imageService.setBannerForUser(file);
        return ResponseEntity.ok().body(this.userProfileService.getUserProfile());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<PublicUserProfileResponseDTO> getPublicUserProfile(@PathVariable Long userId ) {
        return ResponseEntity.ok( userProfileService.getPublicUserProfile(userId) );
    }

    @GetMapping("/by-username/{username}")
    public ResponseEntity<PublicUserProfileResponseDTO> getPublicUserProfileByUsername(@PathVariable String username) {
        return ResponseEntity.ok(userProfileService.getPublicUserProfileByUsername(username));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResultDTO>> searchUsers(@RequestParam String q) {
        return ResponseEntity.ok(userProfileService.searchUsers(q));
    }

    @PatchMapping("/me/profile")
    public ResponseEntity<UserInfoResponseDTO> editUserInfo(
            @Valid @RequestBody UpdateProfileRequestDTO request
    ) {
        return ResponseEntity.ok(userProfileService.updateProfile(request));
    }
}

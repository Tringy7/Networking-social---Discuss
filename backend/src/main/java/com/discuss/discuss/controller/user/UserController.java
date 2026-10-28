package com.discuss.discuss.controller.user;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.community.CommunityPreviewResponseDTO;
import com.discuss.discuss.dto.user.PublicUserProfileResponseDTO;
import com.discuss.discuss.dto.user.UpdateProfileRequestDTO;
import com.discuss.discuss.dto.user.UserInfoResponseDTO;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.service.media.ImageService;
import com.discuss.discuss.service.user.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {
    private final UserProfileService userProfileService;

    private final ImageService imageService;
    private final CommunityService communityService;

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

    @GetMapping("/{name}")
    public ResponseEntity<PublicUserProfileResponseDTO> getPublicUserProfile(@PathVariable String name ) {
        return ResponseEntity.ok( userProfileService.getPublicUserProfileWithName(name) );
    }

    /*
     * Get all communities owned by current user
     */
    @GetMapping("/me/owned")
    public ResponseEntity<PageResponseDTO<CommunityPreviewResponseDTO>> getAllCommunitiesOfOwner(
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(
                communityService.getAllCommunitiesOfOwner(pageable)
        );
    }

    /*
     * Get all communities joined by current user
     */
    @GetMapping("/me/joined")
    public ResponseEntity<PageResponseDTO<CommunityPreviewResponseDTO>> getAllCommunitiesOfJoin(
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(
                communityService.getAllCommunitiesOfJoin(pageable)
        );
    }


    @PatchMapping("/me/profile")
    public ResponseEntity<UserInfoResponseDTO> editUserInfo(
            @Valid @RequestBody UpdateProfileRequestDTO request
    ) {
        return ResponseEntity.ok(userProfileService.updateProfile(request));
    }
}
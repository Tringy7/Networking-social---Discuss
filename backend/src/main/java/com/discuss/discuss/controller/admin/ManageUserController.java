package com.discuss.discuss.controller.admin;

import com.discuss.discuss.dto.admin.AdminResponse;
import com.discuss.discuss.dto.admin.AdminUserSearchRequestDTO;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.user.PublicUserProfileResponseDTO;
import com.discuss.discuss.service.admin.ManageUserService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@Validated
@HasRole("ADMIN")
public class ManageUserController {
    private final ManageUserService manageUserService;

    @GetMapping
    public ResponseEntity<PageResponseDTO<AdminResponse.UserItem>> getUsers(
            @RequestParam(required = false) @Pattern(regexp = "ACTIVE|SUSPENDED") String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(manageUserService.getUsers(pageable, status));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponseDTO<AdminResponse.UserItem>> searchUsers(
            @Valid @ModelAttribute AdminUserSearchRequestDTO request,
            @RequestParam(required = false) @Pattern(regexp = "ACTIVE|SUSPENDED") String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(manageUserService.searchUsers(pageable, request.getSearch(), status));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<PublicUserProfileResponseDTO> getUserDetail(@PathVariable @Positive Long userId) {
        return ResponseEntity.ok(manageUserService.getUserDetail(userId));
    }

    @PatchMapping("/{userId}/lock")
    public ResponseEntity<Void> lockUser(@PathVariable @Positive Long userId) {
        manageUserService.lockUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{userId}/unlock")
    public ResponseEntity<Void> unlockUser(@PathVariable @Positive Long userId) {
        manageUserService.unlockUser(userId);
        return ResponseEntity.noContent().build();
    }
}

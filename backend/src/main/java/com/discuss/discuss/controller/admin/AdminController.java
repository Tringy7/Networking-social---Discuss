package com.discuss.discuss.controller.admin;

import com.discuss.discuss.dto.admin.AdminResponse.*;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.admin.AdminUserSearchRequestDTO;
import com.discuss.discuss.service.admin.AdminService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Validated
@HasRole("ADMIN")
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<Data<Stats>> stats() {
        return ResponseEntity.ok(new Data<>(adminService.stats()));
    }

    @GetMapping("/users")
    public ResponseEntity<PageResponseDTO<UserItem>> getUsers(
            @RequestParam(required = false) @Pattern(regexp = "ACTIVE|SUSPENDED") String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminService.getUsers(pageable, status));
    }

    @GetMapping("/users/search")
    public ResponseEntity<PageResponseDTO<UserItem>> searchUsers(
            @Valid @ModelAttribute AdminUserSearchRequestDTO request,
            @RequestParam(required = false) @Pattern(regexp = "ACTIVE|SUSPENDED") String status,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminService.searchUsers(pageable, request.getSearch(), status));
    }
}

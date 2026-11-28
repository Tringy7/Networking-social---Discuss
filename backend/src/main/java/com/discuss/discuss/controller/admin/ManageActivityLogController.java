package com.discuss.discuss.controller.admin;
import com.discuss.discuss.dto.admin.AdminActivityLogResponseDTO;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.service.admin.AdminActivityLogService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/admin/activity-logs")
@RequiredArgsConstructor
@Validated
@HasRole("ADMIN")
public class ManageActivityLogController {
    private final AdminActivityLogService adminActivityLogService;

    @GetMapping
    public ResponseEntity<PageResponseDTO<AdminActivityLogResponseDTO>> list(
            @RequestParam(required = false) @Positive Long actorUserId,
            @RequestParam(required = false) @Size(max = 80) String action,
            @RequestParam(required = false) @Size(max = 40) String targetType,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminActivityLogService.list(actorUserId, action, targetType, pageable));
    }
}

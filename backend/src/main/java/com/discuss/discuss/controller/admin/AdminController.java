package com.discuss.discuss.controller.admin;

import com.discuss.discuss.dto.admin.AdminResponse.*;
import com.discuss.discuss.service.admin.AdminService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import lombok.RequiredArgsConstructor;
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
}

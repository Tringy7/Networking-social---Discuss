package com.discuss.discuss.controller.admin;

import com.discuss.discuss.dto.admin.AdminCommunitySearchRequestDTO;
import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.community.CommunityDetailResponseDTO;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.service.admin.AdminCommunityService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/communities")
@RequiredArgsConstructor
@Validated
@HasRole("ADMIN")
public class ManageCommunityController {
    private final AdminCommunityService adminCommunityService;

    @GetMapping
    public ResponseEntity<PageResponseDTO<CommunityDetailResponseDTO>> getCommunities(
            @RequestParam(required = false) CommunityStatus status,
            @RequestParam(required = false) CommunityVisibility visibility,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminCommunityService.getCommunities(pageable, status, visibility));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponseDTO<CommunityDetailResponseDTO>> searchCommunities(
            @Valid @ModelAttribute AdminCommunitySearchRequestDTO request,
            @RequestParam(required = false) CommunityStatus status,
            @RequestParam(required = false) CommunityVisibility visibility,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminCommunityService.searchCommunities(pageable, request.getSearch(), status, visibility));
    }

    @GetMapping("/{communityId}")
    public ResponseEntity<CommunityDetailResponseDTO> getCommunityDetail(@PathVariable @Positive Long communityId) {
        return ResponseEntity.ok(adminCommunityService.getCommunityDetail(communityId));
    }

    @PatchMapping("/{communityId}/lock")
    public ResponseEntity<ApiResponse> lockCommunity(@PathVariable @Positive Long communityId) {
        adminCommunityService.lockCommunity(communityId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{communityId}/unlock")
    public ResponseEntity<Void> unlockCommunity(@PathVariable @Positive Long communityId) {
        adminCommunityService.unlockCommunity(communityId);
        return ResponseEntity.noContent().build();
    }
}

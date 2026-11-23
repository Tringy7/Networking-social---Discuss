package com.discuss.discuss.controller.community;

import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.community.CommunityJoinRequestDTO;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import com.discuss.discuss.service.community.CommunityMemberService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/communities")
@RequiredArgsConstructor
public class CommunityMemberController {

    private final CommunityMemberService communityMemberService;

    public record TransferOwnerRequest(
            @NotBlank(message = "username must not be blank")
            String username
    ) {
    }

    public record JoinCommunityResponse(String message, CommunityRole currentUserRole, boolean joinRequestPending) {}

    public record ReviewJoinRequest(@NotNull Boolean approved) {}

    @GetMapping("/{name}/join-requests")
    public PageResponseDTO<CommunityJoinRequestDTO> listJoinRequests(
            @PathVariable String name,
            @RequestParam(defaultValue = "false") boolean history,
            @PageableDefault(size = 10, sort = {"requestedAt", "id"}, direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return communityMemberService.listJoinRequests(name, history, pageable);
    }

    @PatchMapping("/{name}/join-requests/{id}")
    public CommunityJoinRequestDTO reviewJoinRequest(
            @PathVariable String name,
            @PathVariable @Positive Long id,
            @Valid @RequestBody ReviewJoinRequest request
    ) {
        return communityMemberService.reviewJoinRequest(name, id, request.approved());
    }

    @PostMapping("/{name}/members")
    public ResponseEntity<JoinCommunityResponse> joinCommunity(
            @PathVariable String name
    ) {
        var membership = communityMemberService.joinCommunity(name);

        if (membership.pending()) {
            return ResponseEntity.accepted().body(new JoinCommunityResponse("Join request pending", null, true));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new JoinCommunityResponse("Joined community successfully", membership.role(), false));
    }

    @PutMapping("/{communitiesName}/moderators/{username}")
    public ResponseEntity<ApiResponse> appointModerator(
            @PathVariable String communitiesName,
            @PathVariable String username
    ) {
        communityMemberService.appointModerator(communitiesName, username);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(new ApiResponse("Moderator appointed successfully"));
    }

    @DeleteMapping("/{name}/moderators/{username}")
    public ResponseEntity<ApiResponse> removeModerator(
            @PathVariable String name,
            @PathVariable String username
    ) {
        communityMemberService.removeModerator(name, username);

        return ResponseEntity.ok(
                new ApiResponse("Moderator removed successfully")
        );
    }

    @DeleteMapping("/{name}/members/me")
    public ResponseEntity<ApiResponse> leaveCommunity(
            @PathVariable String name
    ) {
        communityMemberService.leaveCommunity(name);

        return ResponseEntity
                .ok(new ApiResponse("Left community successfully"));
    }

    @DeleteMapping("/{communitiesName}/members/{username}")
    public ResponseEntity<ApiResponse> kickMember(
            @PathVariable String communitiesName,
            @PathVariable String username
    ) {
        communityMemberService.kickMember(communitiesName, username);

        return ResponseEntity.ok(
                new ApiResponse("Member removed successfully")
        );
    }

    @PutMapping("/{name}/owner")
    public ResponseEntity<Void> transferOwnership(
            @PathVariable("name") String name,
            @Valid @RequestBody TransferOwnerRequest request
    ) {
        communityMemberService.transferOwnership(name, request.username());
        return ResponseEntity.noContent().build();
    }
}

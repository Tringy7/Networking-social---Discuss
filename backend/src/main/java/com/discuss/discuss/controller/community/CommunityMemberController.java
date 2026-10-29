package com.discuss.discuss.controller.community;

import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.dto.community.RequestBanDTO;
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

    @PostMapping("/{name}/members")
    public ResponseEntity<ApiResponse> joinCommunity(
            @PathVariable String name
    ) {
        communityMemberService.joinCommunity(name);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new ApiResponse("Joined community successfully"));
    }

    @PutMapping("{communitiesName}/moderators/{username}")
    public ResponseEntity<ApiResponse> appointModerator(
            @PathVariable String communitiesName,
            @PathVariable String username
    ) {
        communityMemberService.appointModerator(communitiesName, username);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(new ApiResponse("Moderator appointed successfully"));
    }

    @DeleteMapping("/{name}/moderators/{userId}")
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

    @DeleteMapping("/{communitiesName}/members/{userId}")
    public ResponseEntity<ApiResponse> kickMember(
            @PathVariable String communitiesName,
            @PathVariable String username
    ) {
        communityMemberService.kickMember(communitiesName, username);

        return ResponseEntity.ok(
                new ApiResponse("Member removed successfully")
        );
    }

    @PutMapping("/communities/{name}/owner")
    public ResponseEntity<Void> transferOwnership(
            @PathVariable("name") String name,
            @Valid @RequestBody TransferOwnerRequest request
    ) {
        communityMemberService.transferOwnership(name, request.username());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{name}/bans")
    public ResponseEntity<ApiResponse> bans(
            @PathVariable String name,
            @Valid @RequestBody RequestBanDTO requestBanDTO
    ) {
        communityMemberService.banMember(name, requestBanDTO);

        return ResponseEntity.ok(new ApiResponse("Member banned successfully"));
    }
}

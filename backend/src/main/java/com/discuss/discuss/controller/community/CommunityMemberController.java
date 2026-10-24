package com.discuss.discuss.controller.community;

import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.service.community.CommunityMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/communities")
@RequiredArgsConstructor
public class CommunityMemberController {

    private final CommunityMemberService communityMemberService;

    @PostMapping("/{name}/members")
    public ResponseEntity<ApiResponse> joinCommunity(
            @PathVariable String name
    ) {
        communityMemberService.joinCommunity(name);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new ApiResponse("Joined community successfully"));
    }

    @DeleteMapping("/{name}/members/me")
    public ResponseEntity<ApiResponse> leaveCommunity(
            @PathVariable String name
    ) {
        communityMemberService.leaveCommunity(name);

        return ResponseEntity
                .ok(new ApiResponse("Left community successfully"));
    }
}
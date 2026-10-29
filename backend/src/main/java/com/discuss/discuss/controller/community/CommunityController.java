package com.discuss.discuss.controller.community;

import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.community.CommunityDetailResponseDTO;
import com.discuss.discuss.dto.community.CommunityMemberResponseDTO;
import com.discuss.discuss.dto.community.CreateCommunityRequestDTO;
import com.discuss.discuss.dto.community.UpdateCommunityRequestDTO;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.service.media.ImageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/communities")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;
    private final ImageService imageService;

    /** Creates a new community. */
    @PostMapping
    public ResponseEntity<CommunityDetailResponseDTO> createCommunity(
            @Valid @RequestBody CreateCommunityRequestDTO request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(communityService.createCommunity(request));
    }

    /** Updates an existing community. */
    @PatchMapping("/{name}")
    public ResponseEntity<CommunityDetailResponseDTO> updateCommunity(
            @PathVariable String name,
            @Valid @RequestBody UpdateCommunityRequestDTO request
    ) {
        return ResponseEntity.ok(
                communityService.updateCommunity(name, request)
        );
    }

//    /** Deletes a community. */
//    @DeleteMapping("/{name}")
//    public ResponseEntity<ApiResponse> deleteCommunity(
//            @PathVariable String name
//    ) {
//        communityService.deleteCommunity(name);
//
//        return ResponseEntity.ok(
//                new ApiResponse("Community deleted successfully")
//        );
//    }

    /** Retrieves community details by name. */
    @GetMapping("/{name}")
    public ResponseEntity<CommunityDetailResponseDTO> getCommunityByName(
            @PathVariable String name
    ) {
        return ResponseEntity.ok(
                communityService.getCommunityDetail(name)
        );
    }

    /** Uploads or updates the community avatar. */
    @PutMapping(
            value = "/{name}/avatar",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<CommunityDetailResponseDTO> setAvatar(
            @PathVariable String name,
            @RequestParam("file") MultipartFile file
    ) {
        imageService.setAvatarForCommunity(name, file);

        return ResponseEntity.ok(
                communityService.getCommunityDetail(name)
        );
    }

    /** Uploads or updates the community banner. */
    @PutMapping(
            value = "/{name}/banner",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<CommunityDetailResponseDTO> setBanner(
            @PathVariable String name,
            @RequestParam("file") MultipartFile file
    ) {
        imageService.setBannerForCommunity(name, file);

        return ResponseEntity.ok(
                communityService.getCommunityDetail(name)
        );
    }

    /* Get member of communities by name */
    @GetMapping("/{name}/members")
    public ResponseEntity<PageResponseDTO<CommunityMemberResponseDTO>> getCommunityMembers(
            @PathVariable String name,
            @RequestParam(required = false) CommunityRole role,
            @PageableDefault(
                    size = 10,
                    sort = "joinedAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        PageResponseDTO<CommunityMemberResponseDTO> response =
                communityService.getCommunityMembers(
                        pageable,
                        name,
                        role
                );

        return ResponseEntity.ok().body(response);
    }
}
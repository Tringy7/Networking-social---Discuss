package com.discuss.discuss.controller.community;

import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.community.CommunityDetailResponseDTO;
import com.discuss.discuss.dto.community.CommunityPreviewResponseDTO;
import com.discuss.discuss.dto.community.CreateCommunityRequestDTO;
import com.discuss.discuss.dto.community.UpdateCommunityRequestDTO;
import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.service.media.ImageService;
import com.turkraft.springfilter.boot.Filter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
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

    @PostMapping
    public ResponseEntity<CommunityDetailResponseDTO> createCommunity(
            @Valid @RequestBody CreateCommunityRequestDTO req
    ) {
        CommunityDetailResponseDTO response = communityService.createCommunity(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{name}")
    public ResponseEntity<CommunityDetailResponseDTO> updateCommunity(
            @PathVariable String name,
            @Valid @RequestBody UpdateCommunityRequestDTO request
    ) {
        CommunityDetailResponseDTO response =
                communityService.updateCommunity(name, request);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{name}")
    public ResponseEntity<ApiResponse> deleteCommunity(
            @PathVariable String name
    ) {
        this.communityService.deleteCommunity(name);
        return ResponseEntity.ok().body(new ApiResponse("Community deleted successfully"));
    }

    @PutMapping(
            value = "/{name}/avatar",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<CommunityDetailResponseDTO> setAvatarForCommunity(
            @PathVariable String name,
            @RequestParam("file") MultipartFile file
    ) {
        imageService.setAvatarForCommunity(name, file);

        return ResponseEntity.ok(communityService.getCommunityDetail(name));
    }

    @PutMapping(
            value = "/{communityId}/banner",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<CommunityDetailResponseDTO> setBannerForCommunity(
            @PathVariable String name,
            @RequestParam("file") MultipartFile file
    ) {
        imageService.setBannerForCommunity(name, file);
        return ResponseEntity.ok(communityService.getCommunityDetail(name));
    }

    @GetMapping("/{name}")
    public ResponseEntity<CommunityDetailResponseDTO> getCommunityByName(
            @PathVariable String name
    ) {
        return ResponseEntity.ok(communityService.getCommunityDetail(name));
    }

    @GetMapping
    public ResponseEntity<PageResponseDTO<CommunityPreviewResponseDTO>> getCommunitiesWithFilter(
            @Filter Specification<Community> filterSpec,
            @PageableDefault(
                    size = 10,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return ResponseEntity.ok(
                communityService.getAllCommunitiesWithSpec(filterSpec, pageable)
        );
    }
}

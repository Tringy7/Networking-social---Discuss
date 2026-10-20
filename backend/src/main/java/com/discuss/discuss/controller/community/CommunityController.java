package com.discuss.discuss.controller.community;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.community.CommunityDetailResponseDTO;
import com.discuss.discuss.dto.community.CommunityPreviewResponseDTO;
import com.discuss.discuss.dto.community.CreateCommunityRequestDTO;
import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.service.media.ImageService;
import com.turkraft.springfilter.boot.Filter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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

    @PutMapping(
            value = "/{communityId}/avatar",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public StoredImageDTO setAvatarForCommunity(
            @PathVariable Long communityId,
            @RequestParam("file") MultipartFile file
    ) {
        return imageService.setAvatarForCommunity(communityId, file);
    }

    @PutMapping(
            value = "/{communityId}/banner",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public StoredImageDTO setBannerForCommunity(
            @PathVariable Long communityId,
            @RequestParam("file") MultipartFile file
    ) {
        return imageService.setBannerForCommunity(communityId, file);
    }

    @GetMapping("/{name}")
    public ResponseEntity<CommunityDetailResponseDTO> getCommunity(
            @PathVariable String name
    ) {
        return ResponseEntity.ok(communityService.getCommunity(name));
    }

    @GetMapping
    public ResponseEntity<PageResponseDTO<CommunityPreviewResponseDTO>> getCommunities(
            @Filter Specification<Community> filterSpec,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(
                communityService.getAllCommunityWithFilter(filterSpec, pageable)
        );
    }
}

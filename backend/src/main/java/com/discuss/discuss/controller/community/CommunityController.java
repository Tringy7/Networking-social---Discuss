package com.discuss.discuss.controller.community;

import com.discuss.discuss.dto.community.CommunityDetailResponseDTO;
import com.discuss.discuss.dto.community.CreateCommunityRequestDTO;
import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.service.media.ImageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
}

package com.discuss.discuss.controller.community;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.community.CommunityPreviewResponseDTO;
import com.discuss.discuss.repository.CommunityRepository;
import com.discuss.discuss.service.community.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ExploreCommunityController {
    private final CommunityService communityService;

    @GetMapping("/explore/{slug}")
    public ResponseEntity<PageResponseDTO<CommunityPreviewResponseDTO>> getCommunitiesByCategorySlug(
            @PathVariable String slug,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return ResponseEntity.ok(
                communityService.getCommunitiesByCategorySlug(slug, pageable)
        );
    }
}

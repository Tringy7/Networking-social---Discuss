
package com.discuss.discuss.controller.community;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.community.CommunityPreviewResponseDTO;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.service.community.CommunityService;
import com.turkraft.springfilter.boot.Filter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/explore")
@RequiredArgsConstructor
public class ExploreCommunityController {

    private final CommunityService communityService;

    /** Retrieves communities for the explore page. */
    @GetMapping
    public ResponseEntity<PageResponseDTO<CommunityPreviewResponseDTO>>
    getAllCommunities(
            @PageableDefault(
                    size = 10,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return ResponseEntity.ok(
                communityService.getAllCommunities(pageable)
        );
    }

    /** Retrieves communities by category slug. */
    @GetMapping("/{slug}")
    public ResponseEntity<PageResponseDTO<CommunityPreviewResponseDTO>>
    getCommunitiesByCategory(
            @PathVariable String slug,
            @PageableDefault(
                    size = 10,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return ResponseEntity.ok(
                communityService.getCommunitiesByCategorySlug(
                        slug, pageable
                )
        );
    }

    /** Searches and filters communities with pagination and sorting. */
    @GetMapping("/search")
    public ResponseEntity<PageResponseDTO<CommunityPreviewResponseDTO>>
    searchCommunities(
            @Filter Specification<Community> filterSpec,
            @PageableDefault(
                    size = 10,
                    sort = "createdAt",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return ResponseEntity.ok(
                communityService.getAllCommunitiesWithSpec(
                        filterSpec, pageable
                )
        );
    }
}

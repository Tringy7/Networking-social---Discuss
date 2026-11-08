package com.discuss.discuss.controller.user;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.user.UserSearchResultDTO;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.service.user.UserSearchService;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Validated
public class UserSearchController {
    private final UserSearchService searchService;
    private final PageMapper pageMapper;

    @GetMapping("/search")
    public ResponseEntity<PageResponseDTO<UserSearchResultDTO>> search(
            @RequestParam(defaultValue = "") @Size(max = 200) String q,
            @PageableDefault(size = 20, sort = "username") Pageable pageable) {
        return ResponseEntity.ok(pageMapper.toResponse(searchService.search(q, pageable)));
    }
}

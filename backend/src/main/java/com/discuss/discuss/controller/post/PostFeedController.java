package com.discuss.discuss.controller.post;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.post.PostResponseDTO;
import com.discuss.discuss.service.post.PostQueryService;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController @RequiredArgsConstructor @Validated
public class PostFeedController {
    private final PostQueryService posts;

    @GetMapping("/communities/{name}/posts")
    public PageResponseDTO<PostResponseDTO> community(@PathVariable String name,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return posts.list(name, null, "latest", page, size, null);
    }

    @GetMapping("/users/{username}/posts")
    public PageResponseDTO<PostResponseDTO> user(@PathVariable String username,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return posts.list(null, username, "latest", page, size, null);
    }
}

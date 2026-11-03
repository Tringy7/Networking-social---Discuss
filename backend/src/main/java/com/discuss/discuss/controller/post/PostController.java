package com.discuss.discuss.controller.post;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.post.*;
import com.discuss.discuss.service.post.PostService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/posts")
public class PostController {
    private final PostService postService;

    @PostMapping
    public ResponseEntity<PostResponseDTO> createPost(@Valid @RequestBody CreatePostRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.createPost(request));
    }
    @GetMapping("/{id:\\d+}")
    public PostResponseDTO getPost(@PathVariable Long id) { return postService.getPost(id); }

    /** Full editable document replacement; community is immutable; Markdown, type, link and media are replaced together. */
    @PatchMapping("/{id:\\d+}")
    public PostResponseDTO updatePost(@PathVariable Long id, @Valid @RequestBody CreatePostRequestDTO request) {
        return postService.updatePost(id, request);
    }
    @DeleteMapping("/{id:\\d+}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping
    public PageResponseDTO<PostResponseDTO> list(
            @RequestParam(defaultValue = "for-you") @Pattern(regexp = "for-you|latest|popular") String tab,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) @Size(max = 200) String q) {
        return postService.list(null, null, tab, page, size, q);
    }
}

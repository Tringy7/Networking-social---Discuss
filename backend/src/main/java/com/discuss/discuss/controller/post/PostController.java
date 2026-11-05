package com.discuss.discuss.controller.post;

import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.post.*;
import com.discuss.discuss.service.post.PostService;
import com.discuss.discuss.service.post.PostInteractionService;
import com.discuss.discuss.service.post.PostQueryService;
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
    private final PostInteractionService postInteractionService;
    private final PostQueryService postQueryService;

    @PostMapping
    public ResponseEntity<PostResponseDTO> createPost(@Valid @RequestBody CreatePostRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.createPost(request));
    }

    @PutMapping("/{id}/vote")
    public PostResponseDTO vote(@PathVariable Long id, @Valid @RequestBody VoteRequestDTO request) {
        return postInteractionService.vote(id, request.type());
    }

    @DeleteMapping("/{id}/vote")
    public PostResponseDTO removeVote(@PathVariable Long id) {
        return postInteractionService.vote(id, null);
    }

    @PutMapping("/{id}/save")
    public PostResponseDTO save(@PathVariable Long id) { return postInteractionService.savePost(id, true); }

    @DeleteMapping("/{id}/save")
    public PostResponseDTO unsave(@PathVariable Long id) { return postInteractionService.savePost(id, false); }

    @GetMapping("/saved")
    public PageResponseDTO<PostResponseDTO> saved(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return postQueryService.listSaved(page, size);
    }

    @GetMapping("/trash")
    public PageResponseDTO<TrashedPostResponseDTO> trash(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return postService.listTrash(page, size);
    }

    @PostMapping("/{id}/restore")
    public PostResponseDTO restore(@PathVariable Long id) {
        return postService.restorePost(id);
    }

    @GetMapping("/{id}")
    public PostResponseDTO getPost(@PathVariable Long id) {
        return postService.getPost(id);
    }

    /**
     * Full editable document replacement; community is immutable; Markdown,
     * type, link and media are replaced together.
     */
    @PatchMapping("/{id}")
    public PostResponseDTO updatePost(@PathVariable Long id, @Valid @RequestBody CreatePostRequestDTO request) {
        return postService.updatePost(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.ok().body(new ApiResponse("Post deleted successfully"));
    }

    @GetMapping
    public PageResponseDTO<PostResponseDTO> list(
            @RequestParam(defaultValue = "for-you") @Pattern(regexp = "for-you|latest|popular") String tab,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) @Size(max = 200) String q) {
        return postQueryService.list(null, null, tab, page, size, q);
    }
}

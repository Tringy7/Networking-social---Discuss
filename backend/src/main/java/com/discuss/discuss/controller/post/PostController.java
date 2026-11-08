package com.discuss.discuss.controller.post;

import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.post.*;
import com.discuss.discuss.service.post.PostService;
import com.discuss.discuss.service.post.PostInteractionService;
import com.discuss.discuss.service.post.PostQueryService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;
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

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PostResponseDTO> createPost(@Valid @RequestBody CreatePostRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.createPost(request));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponseDTO> createPostWithImages(
            @Valid @RequestPart("post") CreatePostRequestDTO request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postService.createPost(request, files == null ? List.of() : files));
    }

    @PutMapping("/{id}/vote")
    public ResponseEntity<PostResponseDTO> vote(@PathVariable Long id, @Valid @RequestBody VoteRequestDTO request) {
        return ResponseEntity.ok(postInteractionService.vote(id, request.type()));
    }

    @DeleteMapping("/{id}/vote")
    public ResponseEntity<PostResponseDTO> removeVote(@PathVariable Long id) {
        return ResponseEntity.ok(postInteractionService.vote(id, null));
    }

    @PutMapping("/{id}/save")
    public ResponseEntity<PostResponseDTO> save(@PathVariable Long id) {
        return ResponseEntity.ok(postInteractionService.savePost(id, true));
    }

    @DeleteMapping("/{id}/save")
    public ResponseEntity<PostResponseDTO> unsave(@PathVariable Long id) {
        return ResponseEntity.ok(postInteractionService.savePost(id, false));
    }

    @GetMapping("/saved")
    public ResponseEntity<PageResponseDTO<PostResponseDTO>> saved(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(postQueryService.listSaved(page, size));
    }

    @GetMapping("/trash")
    public ResponseEntity<PageResponseDTO<TrashedPostResponseDTO>> trash(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(postQueryService.listTrash(page, size));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<PostResponseDTO> restore(@PathVariable Long id) {
        return ResponseEntity.ok(postService.restorePost(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponseDTO> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPost(id));
    }

    /**
     * Full editable document replacement; community is immutable; Markdown,
     * type, link and media are replaced together.
     */
    @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PostResponseDTO> updatePost(@PathVariable Long id, @Valid @RequestBody CreatePostRequestDTO request) {
        return ResponseEntity.ok(postService.updatePost(id, request));
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponseDTO> updatePostWithImages(@PathVariable Long id,
            @Valid @RequestPart("post") CreatePostRequestDTO request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return ResponseEntity.ok(postService.updatePost(id, request, files == null ? List.of() : files));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.ok().body(new ApiResponse("Post deleted successfully"));
    }

    @GetMapping
    public ResponseEntity<PageResponseDTO<PostResponseDTO>> list(
            @RequestParam(defaultValue = "for-you") @Pattern(regexp = "for-you|latest|popular") String tab,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) @Size(max = 200) String q) {
        return ResponseEntity.ok(postQueryService.list(null, null, tab, page, size, q));
    }
}

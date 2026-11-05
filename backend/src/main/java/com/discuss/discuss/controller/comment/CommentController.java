package com.discuss.discuss.controller.comment;
import com.discuss.discuss.dto.comment.*;
import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.service.comment.CommentAttachmentService;
import com.discuss.discuss.service.comment.CommentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.*;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/comments")
public class CommentController {
    private final CommentAttachmentService attachmentService;
    private final CommentService commentService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommentResponseDTO> create(@Valid @RequestBody CreateCommentRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.create(request));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CommentResponseDTO> createWithImages(
            @RequestParam @Positive Long postId,
            @RequestParam(required=false) @Positive Long parentId,
            @RequestParam(defaultValue="") @Size(max=10000) String content,
            @RequestPart(required=false) List<MultipartFile> files) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.create(
                new CreateCommentRequestDTO(
                        postId,
                        parentId,
                        content), files == null ? List.of() : files));
    }

    @GetMapping("/attachments/{id}")
    public ResponseEntity<InputStreamResource> download(@PathVariable @Positive Long id) {
        return attachmentService.download(id);
    }

    @PatchMapping("/{id}")
    public CommentResponseDTO update(@PathVariable @Positive Long id,
            @Valid @RequestBody UpdateCommentRequestDTO request) {
        return commentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(@PathVariable @Positive Long id) {
        commentService.delete(id);
        return ResponseEntity.ok().body(new ApiResponse("Comment deleted successfully"));
    }
}

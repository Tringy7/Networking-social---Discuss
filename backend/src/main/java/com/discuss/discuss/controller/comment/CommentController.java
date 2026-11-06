package com.discuss.discuss.controller.comment;
import com.discuss.discuss.dto.comment.*;
import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.service.comment.CommentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
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
    private final CommentService commentService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommentResponseDTO> create(@Valid @RequestBody CreateCommentRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.create(request));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CommentResponseDTO> createWithImages(
            @Valid @RequestPart("comment") CreateCommentRequestDTO request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.create(request, files == null ? List.of() : files));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CommentResponseDTO> update(@PathVariable @Positive Long id,
            @Valid @RequestBody UpdateCommentRequestDTO request) {
        return ResponseEntity.status(HttpStatus.OK).body(commentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(@PathVariable @Positive Long id) {
        commentService.delete(id);
        return ResponseEntity.ok().body(new ApiResponse("Comment deleted successfully"));
    }
}

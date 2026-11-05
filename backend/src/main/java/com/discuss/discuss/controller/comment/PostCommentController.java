package com.discuss.discuss.controller.comment;

import com.discuss.discuss.dto.comment.CommentResponseDTO;
import com.discuss.discuss.service.comment.CommentQueryService;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Validated
@RequestMapping("/posts/{postId}/comments")
public class PostCommentController {
    private final CommentQueryService commentQueryService;

    @GetMapping
    public List<CommentResponseDTO> list(@PathVariable @Positive Long postId) {
        return commentQueryService.list(postId);
    }
}

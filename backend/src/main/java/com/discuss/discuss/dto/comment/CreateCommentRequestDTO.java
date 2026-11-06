package com.discuss.discuss.dto.comment;
import jakarta.validation.constraints.*;
public record CreateCommentRequestDTO(@NotNull @Positive Long postId, @Positive Long parentId,
        @Size(max = 10000) String content) {}

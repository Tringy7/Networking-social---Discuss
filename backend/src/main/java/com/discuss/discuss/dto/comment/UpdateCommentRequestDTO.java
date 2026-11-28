package com.discuss.discuss.dto.comment;

import jakarta.validation.constraints.*;

public record UpdateCommentRequestDTO(@NotBlank @Size(max = 10000) String content) {}

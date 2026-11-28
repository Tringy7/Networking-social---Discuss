package com.discuss.discuss.dto.post;

import java.time.LocalDateTime;

public record TrashedPostResponseDTO(PostResponseDTO post, LocalDateTime deletedAt, boolean canRestore) {}

package com.discuss.discuss.dto.post;

import com.discuss.discuss.enums.VoteType;
import jakarta.validation.constraints.NotNull;

public record VoteRequestDTO(@NotNull VoteType type) {}

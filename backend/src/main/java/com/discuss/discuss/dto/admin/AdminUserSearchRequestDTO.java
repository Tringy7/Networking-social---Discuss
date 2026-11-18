package com.discuss.discuss.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUserSearchRequestDTO {
    @NotBlank
    @Size(max = 200)
    private String search;
}

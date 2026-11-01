package com.discuss.discuss.dto.community;

import com.discuss.discuss.enums.CommunityVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCommunityRequestDTO {

    @NotBlank(message = "Community name is required")
    @Size(min = 3, max = 21, message = "Community name must be between 3 and 21 characters")
    @Pattern(
            regexp = "^[a-zA-Z0-9_]+$",
            message = "Name can only contain letters, numbers and underscores"
    )
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private CommunityVisibility visibility;
}
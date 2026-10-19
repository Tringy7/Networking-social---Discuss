package com.discuss.discuss.dto.community;

import com.discuss.discuss.enums.CommunityVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateCommunityRequestDTO {

    @NotBlank
    @Size(min = 3, max = 21)
    @Pattern(
            regexp = "^[a-zA-Z0-9_]+$",
            message = "Name can only contain letters, numbers and underscores"
    )
    private String name;

    @Size(max = 500)
    private String description;

    @NotNull
    private Long categoryId;

    private CommunityVisibility visibility;

    public void normalize() {
        if (name != null) {
            name = name.trim();
        }
        if (description != null) {
            description = description.trim();
        }
    }
}
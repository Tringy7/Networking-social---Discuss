package com.discuss.discuss.dto.community;

import com.discuss.discuss.enums.CommunityVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateCommunityRequestDTO {

    @Size(max = 500)
    private String description;

    @Size(max = 16000, message = "Community rules must not exceed 16000 characters")
    private String rules;

    private Long categoryId;

    private CommunityVisibility visibility;
}

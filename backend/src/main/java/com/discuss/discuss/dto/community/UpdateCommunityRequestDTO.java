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

    private Long categoryId;

    private CommunityVisibility visibility;
}
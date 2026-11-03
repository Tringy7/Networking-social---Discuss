package com.discuss.discuss.dto.post;

import com.discuss.discuss.enums.PostType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.validator.constraints.URL;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class CreatePostRequestDTO {

    @NotBlank
    @Size(max = 21)
    private String communityName;

    @NotBlank
    @Size(max = 300)
    private String title;

    @NotNull
    private PostType type;

    @Size(max = 50000)
    private String content;

    @Size(max = 5)
    private List<
            @NotBlank
            @Size(max = 50)
                    String
            > tags;

    @Valid
    @Size(max = 20)
    private List<@NotNull PostMediaDTO> media;
}

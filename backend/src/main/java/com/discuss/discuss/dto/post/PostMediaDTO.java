package com.discuss.discuss.dto.post;

import com.discuss.discuss.enums.MediaType;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
public class PostMediaDTO {

    @NotNull
    private MediaType type;

    @NotBlank
    @Size(max = 500)
    private String objectKey;

    @Size(max = 500)
    private String caption;

//    private String thumbnailObjectKey;
}
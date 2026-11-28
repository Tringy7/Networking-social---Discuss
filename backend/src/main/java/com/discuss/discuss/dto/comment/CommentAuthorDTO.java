package com.discuss.discuss.dto.comment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentAuthorDTO {
    private Long id;
    private String username;
    private String displayName;
    private String avatarUrl;

    @Getter(onMethod_ = @JsonProperty("isAuthor"))
    @Setter(onMethod_ = @JsonProperty("isAuthor"))
    private boolean isAuthor;
}

package com.discuss.discuss.dto.comment;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentAttachmentDTO {
    private Long id;
    private String fileName;
    private String contentType;
    private long size;
}

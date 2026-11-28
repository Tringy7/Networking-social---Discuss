package com.discuss.discuss.dto.media;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoredCommentImageDTO {
    private String objectKey;
    private String fileName;
    private String contentType;
    private long size;
}

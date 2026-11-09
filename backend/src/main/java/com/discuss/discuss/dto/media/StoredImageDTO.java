package com.discuss.discuss.dto.media;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StoredImageDTO {
    private String objectKey;
    private String url;
    private String contentType;
    private int width;
    private int height;
    private long size;
}

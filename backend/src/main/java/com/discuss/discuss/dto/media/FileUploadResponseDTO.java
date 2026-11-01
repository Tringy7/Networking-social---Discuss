package com.discuss.discuss.dto.media;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponseDTO {
    private String objectKey;
    private String fileName;
    private String originalFileName;
    private String fileUrl;
    private String contentType;
    private long size;
}

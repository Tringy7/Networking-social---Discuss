package com.discuss.discuss.controller.media;

import com.discuss.discuss.dto.media.FileUploadResponseDTO;
import com.discuss.discuss.service.media.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class MediaController {

    private final MinioService minioService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileUploadResponseDTO> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "posts") String folder
    ) {
        FileUploadResponseDTO response = minioService.uploadFile(file, folder);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/upload/multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<FileUploadResponseDTO>> uploadMultipleFiles(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "folder", defaultValue = "posts") String folder
    ) {
        List<FileUploadResponseDTO> responses = minioService.uploadMultipleFiles(files, folder);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping
    public ResponseEntity<Map<String, String>> deleteFile(@RequestParam("objectKey") String objectKey) {
        minioService.deleteFile(objectKey);
        return ResponseEntity.ok(Map.of("message", "File deleted successfully", "objectKey", objectKey));
    }

    @GetMapping("/presigned")
    public ResponseEntity<Map<String, String>> getPresignedUrl(
            @RequestParam("objectKey") String objectKey,
            @RequestParam(value = "expiryMinutes", defaultValue = "60") int expiryMinutes
    ) {
        String presignedUrl = minioService.getPresignedUrl(objectKey, expiryMinutes);
        return ResponseEntity.ok(Map.of("objectKey", objectKey, "url", presignedUrl));
    }

    @GetMapping("/stream")
    public ResponseEntity<InputStreamResource> streamFile(@RequestParam("objectKey") String objectKey) {
        InputStream stream = minioService.getFileInputStream(objectKey);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + objectKey.substring(objectKey.lastIndexOf('/') + 1) + "\"")
                .body(new InputStreamResource(stream));
    }
}

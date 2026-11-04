package com.discuss.discuss.controller.post;

import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.service.media.ImageService;
import com.discuss.discuss.service.media.PostImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController @RequiredArgsConstructor
@RequestMapping("/posts")
public class PostImageController {
    private final ImageService imageService;

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StoredImageDTO> upload(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(imageService.uploadPostImage(file));
    }
}

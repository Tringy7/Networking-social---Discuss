package com.discuss.discuss.controller.media;

import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.service.media.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    // Set avatar cộng đồng
    @PutMapping(
            value = "/communities/{communityId}/avatar",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public StoredImageDTO setAvatarForCommunity(
            @PathVariable Long communityId,
            @RequestParam("file") MultipartFile file
    ) {
        return imageService.setAvatarForCommunity(communityId, file);
    }

    @PutMapping(
            value = "/communities/{communityId}/banner",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public StoredImageDTO setBannerForCommunity(
            @PathVariable Long communityId,
            @RequestParam("file") MultipartFile file
    ) {
        return imageService.setBannerForCommunity(communityId, file);
    }

//    @PostMapping(value = "/posts/{postId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//    public List<StoredImageDTO> uploadPostImages(
//            @PathVariable String postId,
//            @RequestParam("files") List<MultipartFile> files) {
//        return storage.storePostImages(postId, files);
//    }

//    /** Tạm thời chỉ cho xóa avatar của chính mình; ảnh post xóa qua mediaId khi có PostMedia. */
//    @DeleteMapping
//    public Map<String, String> deleteFile(@RequestParam("objectKey") String objectKey) {
//        if (!storage.isManagedKey(objectKey)
//                || !objectKey.startsWith("avatars/" + currentUserId(auth) + "/")) {
//            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Không có quyền xóa file này");
//        }
//        storage.safeDelete(objectKey);
//        return Map.of("message", "File deleted successfully", "objectKey", objectKey);
//    }
//
//    @GetMapping("/presigned")
//    public Map<String, String> presigned(@RequestParam("objectKey") String objectKey,
//                                         @RequestParam(value = "expiryMinutes", defaultValue = "15") int expiry) {
//        if (!storage.isManagedKey(objectKey)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
//        int safeExpiry = Math.min(Math.max(expiry, 1), 60);
//        return Map.of("objectKey", objectKey, "url", minioService.getPresignedUrl(objectKey, safeExpiry));
//    }
//
//    @GetMapping("/stream")
//    public ResponseEntity<InputStreamResource> stream(@RequestParam("objectKey") String objectKey) {
//        if (!storage.isManagedKey(objectKey)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
//        var stat = minioService.stat(objectKey);   // ném lỗi nếu không tồn tại
//        var stream = minioService.getFileInputStream(objectKey);
//        return ResponseEntity.ok()
//                .contentType(MediaType.parseMediaType(stat.contentType()))
//                .contentLength(stat.size())
//                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
//                .header("X-Content-Type-Options", "nosniff")
//                .body(new InputStreamResource(stream));
//    }

}

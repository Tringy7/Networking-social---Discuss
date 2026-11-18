package com.discuss.discuss.controller.admin;
import com.discuss.discuss.dto.admin.AdminContentSearchRequestDTO;
import com.discuss.discuss.dto.common.ApiResponse;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.post.PostResponseDTO;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.service.admin.AdminPostService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/admin/posts")
@RequiredArgsConstructor
@Validated
@HasRole("ADMIN")
public class ManagePostController {
    private final AdminPostService adminPostService;

    @GetMapping
    public ResponseEntity<PageResponseDTO<PostResponseDTO>> list(
            @RequestParam(required = false) PostStatus status,
            @RequestParam(required = false) @Size(max = 255) String communityName,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminPostService.getPosts(pageable, status, communityName, null));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponseDTO<PostResponseDTO>> search(
            @Valid @ModelAttribute AdminContentSearchRequestDTO request,
            @RequestParam(required = false) PostStatus status,
            @RequestParam(required = false) @Size(max = 255) String communityName,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(adminPostService.getPosts(pageable, status, communityName, request.getSearch()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponseDTO> detail(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(adminPostService.getDetail(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(@PathVariable @Positive Long id) {
        adminPostService.delete(id);
        return ResponseEntity.ok(
                new ApiResponse("Post id " + id + " deleted successfully"));
    }
}

package com.discuss.discuss.controller.admin;
import com.discuss.discuss.dto.admin.AdminContentSearchRequestDTO;
import com.discuss.discuss.dto.comment.CommentResponseDTO;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.enums.CommentStatus;
import com.discuss.discuss.service.admin.AdminCommentService;
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
@RestController @RequestMapping("/admin/comments")
@RequiredArgsConstructor @Validated @HasRole("ADMIN")
public class ManageCommentController {
    private final AdminCommentService service;
    @GetMapping
    public ResponseEntity<PageResponseDTO<CommentResponseDTO>> list(
            @RequestParam(required = false) CommentStatus status,
            @RequestParam(required = false) @Size(max = 255) String communityName,
            @RequestParam(required = false) @Positive Long postId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(service.list(pageable, status, communityName, postId, null));
    }
    @GetMapping("/search")
    public ResponseEntity<PageResponseDTO<CommentResponseDTO>> search(
            @Valid @ModelAttribute AdminContentSearchRequestDTO request,
            @RequestParam(required = false) CommentStatus status,
            @RequestParam(required = false) @Size(max = 255) String communityName,
            @RequestParam(required = false) @Positive Long postId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(service.list(pageable, status, communityName, postId, request.getSearch()));
    }
    @GetMapping("/{id}")
    public ResponseEntity<CommentResponseDTO> detail(@PathVariable @Positive Long id) {
        return ResponseEntity.ok(service.getDetail(id));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}

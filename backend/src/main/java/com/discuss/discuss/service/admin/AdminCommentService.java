package com.discuss.discuss.service.admin;
import com.discuss.discuss.dto.comment.CommentResponseDTO;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.enums.CommentStatus;
import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.service.comment.CommentQueryService;
import com.discuss.discuss.service.comment.CommentService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @RequiredArgsConstructor @HasRole("ADMIN")
public class AdminCommentService {
    private final CommentQueryService queryService;
    private final CommentService commentService;
    private final ActivityLogService activityLogService;
    public PageResponseDTO<CommentResponseDTO> list(Pageable pageable, CommentStatus status, String communityName, Long postId, String search) {
        return queryService.listForAdmin(pageable, status, communityName, postId, search);
    }
    public CommentResponseDTO getDetail(Long id) { return queryService.getForAdmin(id); }
    @Transactional
    public void delete(Long id) {
        commentService.deleteForAdmin(id);
        activityLogService.record("DELETE_COMMENT", "COMMENT", id, null);
    }
}

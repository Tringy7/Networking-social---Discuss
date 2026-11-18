package com.discuss.discuss.service.admin;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.post.PostResponseDTO;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.service.post.PostQueryService;
import com.discuss.discuss.service.post.PostService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@HasRole("ADMIN")
public class AdminPostService {
    private final PostQueryService postQueryService;
    private final PostService postService;
    private final ActivityLogService activityLogService;

    public PageResponseDTO<PostResponseDTO> getPosts(Pageable pageable, PostStatus status, String communityName, String search) {
        return postQueryService.listForAdmin(pageable, status, communityName, search);
    }

    public PostResponseDTO getDetail(Long id) { return postQueryService.getForAdmin(id); }

    @Transactional
    public void delete(Long id) {
        postService.deleteForAdmin(id);
        activityLogService.record("DELETE_POST", "POST", id, null);
    }
}

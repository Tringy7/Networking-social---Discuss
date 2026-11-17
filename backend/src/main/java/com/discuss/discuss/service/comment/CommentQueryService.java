package com.discuss.discuss.service.comment;

import com.discuss.discuss.dto.comment.*;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.exception.comment.CommentErrorCode;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.repository.*;
import com.discuss.discuss.service.post.PostSupport;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommentQueryService {
    private final CommentRepository commentRepository;
    private final UserService userService;
    private final PostSupport postSupport;
    private final CommentSupport commentSupport;
    private final PageMapper pageMapper;

    @Transactional(readOnly = true)
    public List<CommentResponseDTO> list(Long postId) {
        User user = userService.getCurrentUser();
        Post post = postSupport.findPublished(postId);
        postSupport.requireRead(post, user);

        return commentRepository.findByPostIdOrderByCreatedAtAscIdAsc(postId).stream()
                .map(comment -> commentSupport.toResponse(comment, user)).toList();
    }

    @HasRole("ADMIN")
    @Transactional(readOnly = true)
    public PageResponseDTO<CommentResponseDTO> listForAdmin(
            Pageable pageable, CommentStatus status, String communityName,
            Long postId, String search) {
        User actor = userService.getCurrentUser();
        Specification<Comment> filter = (root, query, cb) -> cb.and(
                status == null ? cb.conjunction() : cb.equal(root.get("status"), status),
                communityName == null || communityName.isBlank() ? cb.conjunction()
                        : cb.equal(root.get("post").get("community").get("name"), communityName.trim().toLowerCase(Locale.ROOT)),
                postId == null ? cb.conjunction() : cb.equal(root.get("post").get("id"), postId),
                search == null || search.isBlank() ? cb.conjunction()
                        : cb.greaterThan(cb.locate(cb.lower(root.get("content")), cb.lower(cb.literal(search.trim()))), 0));
        return pageMapper.toResponse(commentRepository.findAll(filter, pageable)
                .map(comment -> commentSupport.toResponse(comment, actor)));
    }

    @HasRole("ADMIN")
    @Transactional(readOnly = true)
    public CommentResponseDTO getForAdmin(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> commentSupport.notFound(CommentErrorCode.COMMENT_NOT_FOUND));
        return commentSupport.toResponse(comment, userService.getCurrentUser());
    }
}

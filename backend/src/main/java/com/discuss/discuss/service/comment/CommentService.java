package com.discuss.discuss.service.comment;
import com.discuss.discuss.dto.comment.*;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.exception.comment.CommentException;
import com.discuss.discuss.exception.comment.CommentErrorCode;
import com.discuss.discuss.repository.*;
import com.discuss.discuss.service.community.CommunityAuthorizationService;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {
    private final CommentSupport commentSupport;
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    private final CommentAttachmentService attachmentService;
    private final UserService userService;
    private final CommunityAuthorizationService authorization;

    public CommentResponseDTO create(CreateCommentRequestDTO request) {
        return create(request, List.of());
    }

    public CommentResponseDTO create(CreateCommentRequestDTO request,
            List<MultipartFile> files) {
        attachmentService.validate(files);
        if ((request.content() == null || request.content().isBlank()) && files.isEmpty()) {
            throw new CommentException(CommentErrorCode.EMPTY_COMMENT);
        }
        if (request.content() != null && request.content().length() > 10000) {
            throw new CommentException(CommentErrorCode.CONTENT_TOO_LONG);
        }

        User user = userService.getCurrentUser();
        Post post = postRepository.lockById(request.postId())
                .orElseThrow(() -> commentSupport.notFound(CommentErrorCode.POST_NOT_FOUND));
        commentSupport.requireAvailablePost(post);
        authorization.requireMembership(post.getCommunity(), user);

        Comment parent = null;
        if (request.parentId() != null) {
            parent = commentSupport.visibleComment(request.parentId());
            if (!Objects.equals(parent.getPost().getId(), post.getId())) {
                throw new CommentException(CommentErrorCode.PARENT_POST_MISMATCH);
            }
        }

        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .parentComment(parent)
                .content(request.content() == null ? "" : request.content().strip())
                .status(CommentStatus.VISIBLE).build();
        commentRepository.saveAndFlush(comment);
        attachmentService.store(comment, files);
        return commentSupport.toResponse(comment);
    }
    public CommentResponseDTO update(Long id, UpdateCommentRequestDTO request) {
        User user = userService.getCurrentUser();
        Comment comment = commentSupport.visibleComment(id);
        commentSupport.requireAvailablePost(comment.getPost());
        if (!Objects.equals(comment.getUser().getId(), user.getId())) {
            throw new CommentException(CommentErrorCode.COMMENT_EDIT_FORBIDDEN);
        }

        authorization.requireMembership(comment.getPost().getCommunity(), user);

        comment.setContent(request.content().strip());
        commentRepository.flush();
        return commentSupport.toResponse(comment);
    }
    public void delete(Long id) {
        User user = userService.getCurrentUser();
        Comment comment = commentSupport.visibleComment(id);
        if (!Objects.equals(comment.getUser().getId(), user.getId()) && user.getRole() != UserRole.ADMIN) {
            authorization.requireModeratorOrOwner(comment.getPost().getCommunity(), user);
        }
        comment.setStatus(CommentStatus.DELETED);
        comment.setContent("[deleted]");
        comment.setDeletedAt(LocalDateTime.now());
    }

}

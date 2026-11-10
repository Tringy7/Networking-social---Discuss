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
    private final CommentVoteRepository voteRepository;
    private final com.discuss.discuss.service.post.PostSupport postSupport;
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
        authorization.requireCommentPermission(post.getCommunity(), user);

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
        return commentSupport.toResponse(comment, user);
    }
    public CommentResponseDTO update(Long id, UpdateCommentRequestDTO request) {
        User user = userService.getCurrentUser();
        Comment comment = commentSupport.visibleComment(id);
        commentSupport.requireAvailablePost(comment.getPost());
        if (!Objects.equals(comment.getUser().getId(), user.getId())) {
            throw new CommentException(CommentErrorCode.COMMENT_EDIT_FORBIDDEN);
        }

        authorization.requireCommentPermission(comment.getPost().getCommunity(), user);

        comment.setContent(request.content().strip());
        commentRepository.flush();
        return commentSupport.toResponse(comment, user);
    }
    /** Serializes vote changes on the comment, keeping PUT and DELETE idempotent. */
    public CommentResponseDTO vote(Long id, VoteType type) {
        User user = userService.getCurrentUser();

        Comment comment = commentSupport.visibleComment(id);
        commentSupport.requireAvailablePost(comment.getPost());
        postSupport.requireRead(comment.getPost(), user);
        CommentVote existing = voteRepository.findByCommentIdAndUserId(id, user.getId()).orElse(null);
        if (type == null) {
            if (existing != null) voteRepository.delete(existing);
        } else if (existing == null) {
            voteRepository.save(CommentVote.builder().comment(comment).user(user).voteType(type).build());
        } else {
            existing.setVoteType(type);
        }
        voteRepository.flush();
        return commentSupport.toResponse(comment, user);
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


    @Transactional(readOnly = true)
    public long countAll() {
        return commentRepository.count();
    }
}

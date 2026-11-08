package com.discuss.discuss.service.comment;

import com.discuss.discuss.dto.comment.*;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.exception.comment.CommentException;
import com.discuss.discuss.exception.comment.CommentErrorCode;
import com.discuss.discuss.repository.*;
import com.discuss.discuss.mapper.comment.CommentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CommentSupport {
    private final CommentRepository commentRepository;
    private final CommentAttachmentRepository attachmentRepository;
    private final CommentMapper commentMapper;
    private final CommentVoteRepository voteRepository;

    public Comment findComment(Long id) {
        return commentRepository.findById(id)
                .filter(comment -> comment.getStatus() == CommentStatus.VISIBLE
                        && comment.getDeletedAt() == null)
                .orElseThrow(() -> notFound(CommentErrorCode.COMMENT_NOT_FOUND));
    }

    public Comment visibleComment(Long id) {
        return commentRepository.lockById(id).filter(c -> c.getStatus() == CommentStatus.VISIBLE)
                .orElseThrow(() -> notFound(CommentErrorCode.COMMENT_NOT_FOUND));
    }

    public void requireAvailablePost(Post post) {
        if (post.getStatus() != PostStatus.PUBLISHED || post.getCommunity().getStatus() != CommunityStatus.ACTIVE) {
            throw notFound(CommentErrorCode.POST_NOT_FOUND);
        }
    }

    public CommentException notFound(CommentErrorCode error) {
        return new CommentException(error);
    }

    public CommentResponseDTO toResponse(Comment comment, User user) {
        List<CommentAttachment> attachments = comment.getStatus() == CommentStatus.VISIBLE
                ? attachmentRepository.findByCommentIdOrderByIdAsc(comment.getId())
                : List.of();
        CommentResponseDTO response = commentMapper.toResponse(comment, attachments);
        if (comment.getStatus() == CommentStatus.VISIBLE) {
            response.setVoteScore(voteRepository.voteScore(comment.getId()));
            response.setUserVote(voteRepository.findByCommentIdAndUserId(comment.getId(), user.getId())
                    .map(CommentVote::getVoteType).orElse(null));
        }
        return response;
    }
}

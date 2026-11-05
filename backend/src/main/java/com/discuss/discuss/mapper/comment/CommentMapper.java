package com.discuss.discuss.mapper.comment;

import com.discuss.discuss.dto.comment.CommentAttachmentDTO;
import com.discuss.discuss.dto.comment.CommentAuthorDTO;
import com.discuss.discuss.dto.comment.CommentResponseDTO;
import com.discuss.discuss.entity.Comment;
import com.discuss.discuss.entity.CommentAttachment;
import com.discuss.discuss.enums.CommentStatus;
import com.discuss.discuss.service.media.MinioService;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CommentMapper {
    private final MinioService minio;

    public CommentResponseDTO toResponse(Comment c, List<CommentAttachment> attachments) {
        return new CommentResponseDTO(c.getId(), c.getPost().getId(), c.getUser().getId(),
                c.getParentComment() == null ? null : c.getParentComment().getId(),
                c.getStatus() == CommentStatus.VISIBLE ? c.getContent() : "[deleted]",
                c.getStatus(), c.getCreatedAt(), c.getUpdatedAt(),
                new CommentAuthorDTO(c.getUser().getId(), c.getUser().getUsername(),
                        c.getUser().getProfile() == null ? c.getUser().getUsername() : c.getUser().getProfile().getDisplayName(),
                        c.getUser().getProfile() == null || c.getUser().getProfile().getAvatar() == null
                                ? null : minio.buildFileUrl(c.getUser().getProfile().getAvatar()),
                        c.getPost().getUser() != null && Objects.equals(c.getUser().getId(), c.getPost().getUser().getId())),
                c.getStatus() == CommentStatus.VISIBLE
                        ? attachments.stream().map(this::toAttachment).toList()
                        : List.of());
    }

    private CommentAttachmentDTO toAttachment(CommentAttachment attachment) {
        return new CommentAttachmentDTO(attachment.getId(), attachment.getFileName(),
                attachment.getContentType(), attachment.getSize());
    }
}

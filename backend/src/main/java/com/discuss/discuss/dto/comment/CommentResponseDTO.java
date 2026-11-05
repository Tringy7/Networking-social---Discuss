package com.discuss.discuss.dto.comment;

import com.discuss.discuss.enums.CommentStatus;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponseDTO {
    private Long id;
    private Long postId;
    private Long authorId;
    private Long parentId;
    private String content;
    private CommentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private CommentAuthorDTO author;
    private List<CommentAttachmentDTO> attachments;
}

package com.discuss.discuss.dto.report;

import com.discuss.discuss.dto.community.CommunityDetailResponseDTO;
import com.discuss.discuss.dto.comment.CommentAttachmentDTO;
import com.discuss.discuss.dto.post.PostResponseDTO;
import com.discuss.discuss.enums.CommentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminReportTargetDTO {
    private PostResponseDTO post;
    private CommentPreview comment;
    private CommunityDetailResponseDTO community;
    private MessagePreview message;

    public AdminReportTargetDTO(PostResponseDTO post, CommentPreview comment, CommunityDetailResponseDTO community) {
        this(post, comment, community, null);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessagePreview {
        private Long id;
        private String username;
        private String content;
        private int attachmentCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommentPreview {
        private Long id;
        private String username;
        private String content;
        private CommentStatus status;
        private List<CommentAttachmentDTO> attachments;
    }
}

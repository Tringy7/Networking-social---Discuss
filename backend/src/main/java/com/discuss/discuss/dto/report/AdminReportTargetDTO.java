package com.discuss.discuss.dto.report;

import com.discuss.discuss.dto.community.CommunityDetailResponseDTO;
import com.discuss.discuss.dto.comment.CommentAttachmentDTO;
import com.discuss.discuss.dto.post.PostResponseDTO;
import com.discuss.discuss.enums.CommentStatus;
import java.util.List;

public record AdminReportTargetDTO(
        PostResponseDTO post,
        CommentPreview comment,
        CommunityDetailResponseDTO community
) {
    public record CommentPreview(
            Long id, String username, String content, CommentStatus status, List<CommentAttachmentDTO> attachments
    ) {}
}

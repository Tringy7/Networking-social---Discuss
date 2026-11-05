package com.discuss.discuss.service.comment;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.CommentStatus;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.repository.*;
import com.discuss.discuss.exception.comment.CommentException;
import com.discuss.discuss.exception.comment.CommentErrorCode;
import com.discuss.discuss.service.media.ImageService;
import com.discuss.discuss.service.community.CommunityAuthorizationService;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.*;
import org.springframework.core.io.InputStreamResource;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class CommentAttachmentService {
    private final CommentAttachmentRepository attachments;
    private final ImageService imageService;
    private final UserService users;
    private final CommunityAuthorizationService authorization;

    public void validate(List<MultipartFile> images) {
        imageService.validateCommentImages(images);
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.MANDATORY)
    public void store(Comment comment, List<MultipartFile> images) {
        validate(images);
        for (MultipartFile image : images) {
            var stored = imageService.storeCommentImage(comment.getId(), image);
            attachments.save(CommentAttachment.builder().comment(comment)
                    .objectKey(stored.getObjectKey()).fileName(stored.getFileName())
                    .contentType(stored.getContentType()).size(stored.getSize()).build());
        }
        attachments.flush();
    }

    @Transactional(readOnly=true)
    public ResponseEntity<InputStreamResource> download(Long id) {
        User user = users.getCurrentUser();
        CommentAttachment attachment = attachments.findById(id).orElseThrow(this::notFound);
        Comment comment = attachment.getComment();
        Post post = comment.getPost();
        if (comment.getStatus() != CommentStatus.VISIBLE || post.getStatus() != PostStatus.PUBLISHED
                || post.getCommunity().getStatus() != CommunityStatus.ACTIVE) throw notFound();
        if (post.getCommunity().getVisibility() == CommunityVisibility.PRIVATE)
            authorization.requireMembership(post.getCommunity(),user);
        boolean image = "image/png".equals(attachment.getContentType());
        ContentDisposition disposition = (image ? ContentDisposition.inline() : ContentDisposition.attachment())
                .filename(attachment.getFileName(),StandardCharsets.UTF_8).build();
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(attachment.getContentType()))
                .contentLength(attachment.getSize()).header(HttpHeaders.CONTENT_DISPOSITION,disposition.toString())
                .header("X-Content-Type-Options","nosniff").cacheControl(CacheControl.noStore())
                .body(new InputStreamResource(imageService.openCommentImage(attachment.getObjectKey())));
    }
    private CommentException notFound() { return new CommentException(CommentErrorCode.ATTACHMENT_NOT_FOUND); }
}

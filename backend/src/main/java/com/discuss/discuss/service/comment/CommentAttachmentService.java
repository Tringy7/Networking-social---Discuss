package com.discuss.discuss.service.comment;
import com.discuss.discuss.entity.Comment;
import com.discuss.discuss.entity.CommentAttachment;
import com.discuss.discuss.repository.CommentAttachmentRepository;
import com.discuss.discuss.service.media.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentAttachmentService {
    private final CommentAttachmentRepository attachments;
    private final ImageService imageService;

    public void validate(List<MultipartFile> images) {
        imageService.validateCommentImages(images);
    }

    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.MANDATORY)
    public void store(Comment comment, List<MultipartFile> images) {
        validate(images);
        for (MultipartFile image : images) {
            var stored = imageService.storeCommentImage(comment.getId(), image);
            attachments.save(
                    CommentAttachment.builder()
                            .comment(comment)
                            .objectKey(stored.getObjectKey())
                            .fileName(stored.getFileName())
                            .contentType(stored.getContentType())
                            .size(stored.getSize()).build());
        }
        attachments.flush();
    }

}

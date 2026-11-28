package com.discuss.discuss.repository;
import com.discuss.discuss.entity.CommentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CommentAttachmentRepository extends JpaRepository<CommentAttachment, Long> {
    List<CommentAttachment> findByCommentIdOrderByIdAsc(Long commentId);
}

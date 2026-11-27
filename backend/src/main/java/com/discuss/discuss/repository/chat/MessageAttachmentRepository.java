package com.discuss.discuss.repository.chat;

import com.discuss.discuss.entity.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;

public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, Long> {
    List<MessageAttachment> findByMessageIdInOrderById(Collection<Long> ids);
}

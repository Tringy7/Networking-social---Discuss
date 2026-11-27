package com.discuss.discuss.service.chat;

import com.discuss.discuss.entity.MessageAttachment;
import com.discuss.discuss.exception.chat.ChatErrorCode;
import com.discuss.discuss.exception.chat.ChatException;
import com.discuss.discuss.repository.chat.MessageAttachmentRepository;
import com.discuss.discuss.service.media.AttachmentMediaService;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatAttachmentService {
    private final UserService users;
    private final MessageAttachmentRepository attachments;
    private final AttachmentMediaService media;
    private final ChatAccess access;
    private final ChatMessageStore messageStore;

    public MessageAttachment storeAttachment(long messageId, MultipartFile file) {
        try {
            var stored = media.storeChatAttachment(messageId, file);
            var attachment = new MessageAttachment();
            attachment.setMessageId(messageId);
            attachment.setObjectKey(stored.objectKey());
            attachment.setFilename(stored.filename());
            attachment.setContentType(stored.contentType());
            return attachments.save(attachment);
        } catch (IOException failure) {
            throw new ChatException(ChatErrorCode.ATTACHMENT_READ_FAILED, failure);
        }
    }

    public String getMessageAttachmentUrl(long id, long messageId, long attachmentId) {
        long actor = users.getCurrentUser().getId();
        access.requireConversationMember(id, actor);
        var message = messageStore.findMessage(id, messageId);
        if (ChatMessageStore.hidden(message, actor) || message.getRecalledAt() != null) throw new ChatException(ChatErrorCode.ATTACHMENT_NOT_FOUND);
        var attachment = attachments.findById(attachmentId).filter(item -> item.getMessageId().equals(messageId))
                .orElseThrow(() -> new ChatException(ChatErrorCode.ATTACHMENT_NOT_FOUND));
        return media.getChatAttachmentUrl(attachment.getObjectKey());
    }
}

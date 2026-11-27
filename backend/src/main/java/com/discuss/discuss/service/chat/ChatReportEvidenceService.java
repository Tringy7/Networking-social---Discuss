package com.discuss.discuss.service.chat;

import com.discuss.discuss.dto.chat.ChatReportEvidenceDTO;
import com.discuss.discuss.exception.report.ReportErrorCode;
import com.discuss.discuss.exception.report.ReportException;
import com.discuss.discuss.mapper.chat.ChatMapper;
import com.discuss.discuss.repository.chat.ConversationMemberRepository;
import com.discuss.discuss.repository.chat.MessageAttachmentRepository;
import com.discuss.discuss.repository.chat.MessageRepository;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatReportEvidenceService {
    private final ChatMapper mapper;
    private final ConversationMemberRepository members;
    private final MessageRepository messages;
    private final UserService users;
    private final MessageAttachmentRepository attachments;

    public ChatReportEvidenceDTO getMessageReportEvidence(long messageId, long reporter) {
        var message = messages.findById(messageId)
                .orElseThrow(() -> new ReportException(ReportErrorCode.TARGET_NOT_FOUND));
        if (members.findByConversationIdAndUserId(message.getConversationId(), reporter).isEmpty()
                || message.getSenderId().equals(reporter) || ChatMessageStore.hidden(message, reporter) || message.getRecalledAt() != null) {
            throw new ReportException(ReportErrorCode.TARGET_NOT_FOUND);
        }
        return mapper.toReportEvidence(message, users.getById(message.getSenderId()).getUsername(),
                attachments.findByMessageIdInOrderById(List.of(messageId)).size());
    }
}

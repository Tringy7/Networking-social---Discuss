package com.discuss.discuss.service.chat;

import com.discuss.discuss.entity.MessageReaction;
import com.discuss.discuss.exception.chat.ChatErrorCode;
import com.discuss.discuss.exception.chat.ChatException;
import com.discuss.discuss.repository.chat.MessageReactionRepository;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatReactionService {
    private final UserService users;
    private final MessageReactionRepository reactions;
    private final ChatAccess access;
    private final ChatChangePublisher changes;
    private final ChatMessageStore messageStore;
    private static final Set<String> REACTION_CODES = Set.of("LIKE", "LOVE", "LAUGH", "WOW", "SAD", "CELEBRATE");

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void updateMessageReaction(long id, long messageId, String code) {
        long actor = users.getCurrentUser().getId();
        var request = access.lockConversationForMember(id, actor);
        access.requirePairNotBlocked(request.getSenderId(), request.getRecipientId());
        ChatAccess.requireAcceptedConversation(request, ChatErrorCode.REQUEST_NOT_ACCEPTED);
        messageStore.requireVisibleMessage(id, messageId, actor);
        var reaction = reactions.findByMessageIdInOrderById(List.of(messageId)).stream()
                .filter(item -> item.getUserId().equals(actor)).findFirst();
        if (code == null) {
            reaction.ifPresent(reactions::delete);
        } else {
            if (!REACTION_CODES.contains(code)) {
                throw new ChatException(ChatErrorCode.UNSUPPORTED_REACTION);
            }
            var item = reaction.orElseGet(MessageReaction::new);
            item.setMessageId(messageId);
            item.setUserId(actor);
            item.setEmoji(code);
            reactions.save(item);
        }
        changes.changed(request);
    }
}

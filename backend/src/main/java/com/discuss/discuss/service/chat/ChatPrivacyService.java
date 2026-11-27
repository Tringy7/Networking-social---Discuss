package com.discuss.discuss.service.chat;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserBlock;
import com.discuss.discuss.entity.UserPrivacySettings;
import com.discuss.discuss.exception.chat.ChatErrorCode;
import com.discuss.discuss.exception.chat.ChatException;
import com.discuss.discuss.repository.UserPrivacySettingsRepository;
import com.discuss.discuss.repository.chat.ConversationRepository;
import com.discuss.discuss.repository.chat.UserBlockRepository;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatPrivacyService {
    private final ConversationRepository conversations;
    private final UserBlockRepository blocks;
    private final UserService users;
    private final UserPrivacySettingsRepository privacy;
    private final ChatAccess access;
    private final ChatChangePublisher changes;

    public boolean allowsNewConversations() {
        return allowsNewConversations(users.getCurrentUser());
    }

    public boolean allowsNewConversations(User user) {
        return privacy.findByUser(user).map(UserPrivacySettings::getAllowChatRequests).orElse(true);
    }

    @Transactional
    public void updateIncomingChatPreference(boolean allowed) {
        User actor = users.getCurrentUser();
        access.lockActiveUser(actor.getId());
        var settings = privacy.findByUser(actor).orElseGet(() -> UserPrivacySettings.builder().user(actor).build());
        settings.setAllowChatRequests(allowed);
        privacy.save(settings);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void setUserBlocked(String username, boolean blocked) {
        long actor = users.getCurrentUser().getId();
        long peer = users.getByUsername(username).getId();
        if (actor == peer) throw new ChatException(ChatErrorCode.CANNOT_BLOCK_SELF);
        access.lockPair(actor, peer);
        var existing = blocks.findByBlockerIdAndBlockedId(actor, peer);
        if (!blocked) existing.ifPresent(blocks::delete);
        else if (existing.isEmpty()) {
            var block = new UserBlock();
            block.setBlockerId(actor);
            block.setBlockedId(peer);
            blocks.save(block);
        }
        conversations.findByDirectKey(ChatAccess.directKey(actor, peer)).ifPresent(conversation -> changes.changed(access.requireChatRequest(conversation.getId())));
    }
}

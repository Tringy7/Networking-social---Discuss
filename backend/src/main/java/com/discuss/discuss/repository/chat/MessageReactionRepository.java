package com.discuss.discuss.repository.chat;

import com.discuss.discuss.entity.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;

public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {
    List<MessageReaction> findByMessageIdInOrderById(Collection<Long> ids);
}

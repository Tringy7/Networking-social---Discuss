package com.discuss.discuss.repository.chat;

import com.discuss.discuss.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {
    Optional<UserBlock> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
}

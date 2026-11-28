package com.discuss.discuss.service.chat;

import com.discuss.discuss.exception.chat.ChatErrorCode;
import com.discuss.discuss.exception.chat.ChatException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatRateLimit {
    private static final DefaultRedisScript<Long> INCREMENT = new DefaultRedisScript<>("""
            local total = redis.call('INCR', KEYS[1])
            if total == 1 then redis.call('EXPIRE', KEYS[1], 60) end
            return total
            """, Long.class);
    private final StringRedisTemplate redis;

    public void acquire(long actor, String operation, int limit) {
        Long total = redis.execute(INCREMENT, List.of("discuss:chat:rate:" + operation + ":" + actor));
        if (total == null || total > limit) {
            throw new ChatException(ChatErrorCode.RATE_LIMIT_EXCEEDED);
        }
    }
}

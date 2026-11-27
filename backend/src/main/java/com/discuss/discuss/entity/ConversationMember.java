package com.discuss.discuss.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "chat_members", uniqueConstraints = @UniqueConstraint(columnNames = {"conversation_id", "user_id"}))
public class ConversationMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long conversationId;
    @Column(nullable = false)
    private Long userId;
    private Long readThrough;
    private boolean pinned;
    private boolean hidden;
    private boolean muted;
}

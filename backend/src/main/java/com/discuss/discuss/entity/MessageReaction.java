package com.discuss.discuss.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "chat_reactions", indexes = @Index(columnList = "message_id"), uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "user_id"}))
public class MessageReaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long messageId;
    @Column(nullable = false)
    private Long userId;
    @Column(nullable = false, length = 16)
    private String emoji;
}

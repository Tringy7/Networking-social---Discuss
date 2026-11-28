package com.discuss.discuss.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.BatchSize;

@Entity
@Getter
@Setter
@Table(name = "chat_messages", uniqueConstraints = @UniqueConstraint(columnNames = {"conversation_id", "sender_id", "client_id"}), indexes = @Index(columnList = "conversation_id,id"))
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long conversationId;
    @Column(nullable = false)
    private Long senderId;
    @Column(nullable = false, length = 36)
    private String clientId;
    @Column(nullable = false, length = 4000)
    private String body;
    @Column(nullable = false)
    private Instant createdAt;
    private Long replyToId;
    private Instant editedAt;
    private Instant recalledAt;
    @ElementCollection
    @BatchSize(size = 30)
    @CollectionTable(name = "chat_hidden_messages", joinColumns = @JoinColumn(name = "message_id"))
    @Column(name = "user_id", nullable = false)
    private Set<Long> hiddenFor = new HashSet<>();
}

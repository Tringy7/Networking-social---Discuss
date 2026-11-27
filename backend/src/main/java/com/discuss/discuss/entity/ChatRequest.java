package com.discuss.discuss.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "chat_requests")
public class ChatRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long conversationId;
    @Column(nullable = false)
    private Long senderId;
    @Column(nullable = false)
    private Long recipientId;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status;

    public Status getConversationStatus() {
        // Direct conversations are available regardless of their legacy request status.
        return Status.ACCEPTED;
    }

    public enum Status { PENDING, ACCEPTED, REJECTED, WITHDRAWN }
}

package com.discuss.discuss.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "chat_conversations")
public class Conversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 50)
    private String directKey;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Kind kind;
    public enum Kind { DIRECT, GROUP }
}

package com.discuss.discuss.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "chat_attachments", indexes = @Index(columnList = "message_id"))
public class MessageAttachment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long messageId;
    @Column(nullable = false, unique = true, length = 100)
    private String objectKey;
    @Column(nullable = false, length = 180)
    private String filename;
    @Column(nullable = false, length = 80)
    private String contentType;
}

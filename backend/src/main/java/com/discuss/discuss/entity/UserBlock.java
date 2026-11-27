package com.discuss.discuss.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "chat_blocks", uniqueConstraints = @UniqueConstraint(columnNames = {"blocker_id", "blocked_id"}))
public class UserBlock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long blockerId;
    @Column(nullable = false)
    private Long blockedId;
}

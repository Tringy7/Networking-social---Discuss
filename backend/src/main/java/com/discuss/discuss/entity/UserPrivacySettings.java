package com.discuss.discuss.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@org.hibernate.annotations.DynamicUpdate
@Table(name = "user_privacy_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPrivacySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_user_privacy_settings_user")
    )
    private User user;

    @Builder.Default
    @Column(nullable = false)
    private boolean showDateOfBirth = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean showLocation = true;

    private Boolean allowChatRequests;

//    @Builder.Default
//    @Column(nullable = false)

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

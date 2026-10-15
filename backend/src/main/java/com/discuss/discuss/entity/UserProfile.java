package com.discuss.discuss.entity;

import com.discuss.discuss.enums.Gender;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_user_profiles_user")
    )
    private User user;

    @Column(length = 50)
    private String displayName;

    @Column(length = 500)
    private String bio;

    @Column(length = 500)
    private String avatar;

    @Column(length = 500)
    private String banner;

    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Gender gender;

    @Column(length = 100)
    private String location;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
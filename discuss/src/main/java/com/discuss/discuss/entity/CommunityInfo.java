package com.discuss.discuss.entity;

import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "community_info")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "community_id", referencedColumnName = "id", nullable = false)
    private Community community;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommunityVisibility visibility;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CommunityStatus status;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

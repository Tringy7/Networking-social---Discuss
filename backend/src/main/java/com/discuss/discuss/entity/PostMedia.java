package com.discuss.discuss.entity;

import com.discuss.discuss.enums.MediaType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "post_media", uniqueConstraints = {
        @UniqueConstraint(name = "uk_post_media_object_key", columnNames = "object_key")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostMedia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MediaType type;

    @Column(name = "object_key", nullable = false, length = 500)
    private String objectKey;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(length = 500)
    private String caption;
}

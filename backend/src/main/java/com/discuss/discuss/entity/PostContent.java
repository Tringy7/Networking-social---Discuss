package com.discuss.discuss.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "post_contents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "post_id", referencedColumnName = "id", nullable = false)
    private Post post;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(columnDefinition = "MEDIUMTEXT", nullable = false)
    private String content;

    @ElementCollection
    @CollectionTable(name = "post_tags", joinColumns = @JoinColumn(name = "post_content_id"))
    @OrderColumn(name = "display_order")
    @Column(name = "tag", nullable = false, length = 50)
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    // Legacy storage retained for reading posts created by the earlier blocks contract.
    @ElementCollection
    @CollectionTable(name = "post_blocks", joinColumns = @JoinColumn(name = "post_content_id"))
    @OrderColumn(name = "block_position")
    @Builder.Default
    private List<PostBlock> blocks = new ArrayList<>();

    @Column(length = 2048)
    private String linkUrl;

    @Column(length = 50)
    private String codeLanguage; // Legacy code is adapted to fenced Markdown on reads.

    @Column(columnDefinition = "TEXT")
    private String code;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

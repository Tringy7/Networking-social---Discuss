package com.discuss.discuss.entity;

import com.discuss.discuss.enums.PostBlockType;
import jakarta.persistence.*;
import lombok.*;

/** Ordered value object owned by PostContent; block identity is its position in the document. */
@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PostBlock {
    @Enumerated(EnumType.STRING)
    @Column(name = "block_type", nullable = false, length = 16)
    private PostBlockType type;

    @Column(name = "text_content", columnDefinition = "MEDIUMTEXT")
    private String text;

    @Column(length = 300)
    private String objectKey;

    @Column(length = 50)
    private String language;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String code;

    @Column(length = 2048)
    private String url;
}

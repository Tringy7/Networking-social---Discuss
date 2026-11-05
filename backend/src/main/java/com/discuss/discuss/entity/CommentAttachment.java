package com.discuss.discuss.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "comment_attachments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CommentAttachment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="comment_id", nullable=false) private Comment comment;
    @Column(nullable=false, unique=true) private String objectKey;
    @Column(nullable=false, length=255) private String fileName;
    @Column(nullable=false) private String contentType;
    @Column(nullable=false) private long size;
}

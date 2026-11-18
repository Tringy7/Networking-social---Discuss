package com.discuss.discuss.service.admin;

import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.repository.*;
import com.discuss.discuss.service.post.*;
import com.discuss.discuss.service.comment.*;
import com.discuss.discuss.service.user.UserService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminContentDeletionTest {
    @Mock PostRepository postRepository;
    @Mock CommentRepository commentRepository;
    @Mock UserService userService;
    @Mock PostSupport postSupport;
    @Mock CommentSupport commentSupport;
    @InjectMocks PostService posts;
    @InjectMocks CommentService comments;

    @Test void hiddenPostCanBeDeletedAndCannotBeRestoredByItsAuthor() {
        var actor = User.builder().id(1L).role(UserRole.ADMIN).build();
        var author = User.builder().id(2L).build();
        var post = Post.builder().id(3L).user(author).status(PostStatus.HIDDEN).build();
        when(userService.getCurrentUser()).thenReturn(actor);
        when(postRepository.lockById(3L)).thenReturn(Optional.of(post));
        posts.deleteForAdmin(3L);
        assertEquals(PostStatus.DELETED, post.getStatus());
        assertEquals(actor.getId(), post.getDeletedByUserId());
        assertNotNull(post.getDeletedAt());
        assertNotEquals(author.getId(), post.getDeletedByUserId());
    }

    @Test void repeatedPostDeletionKeepsOriginalDeletionMetadata() {
        var time = LocalDateTime.of(2026, 1, 1, 12, 0);
        var post = Post.builder().id(3L).status(PostStatus.DELETED).deletedAt(time).deletedByUserId(9L).build();
        when(postRepository.lockById(3L)).thenReturn(Optional.of(post));
        posts.deleteForAdmin(3L);
        assertEquals(time, post.getDeletedAt());
        assertEquals(9L, post.getDeletedByUserId());
    }

    @Test void hiddenCommentUsesExistingDeletedPlaceholderRule() {
        var comment = Comment.builder().id(3L).status(CommentStatus.HIDDEN).content("violation").build();
        when(commentRepository.lockById(3L)).thenReturn(Optional.of(comment));
        comments.deleteForAdmin(3L);
        assertEquals(CommentStatus.DELETED, comment.getStatus());
        assertEquals("[deleted]", comment.getContent());
        assertNotNull(comment.getDeletedAt());
    }

    @Test void repeatedCommentDeletionKeepsTimestamp() {
        var time = LocalDateTime.of(2026, 1, 1, 12, 0);
        var comment = Comment.builder().id(3L).status(CommentStatus.DELETED).deletedAt(time).content("[deleted]").build();
        when(commentRepository.lockById(3L)).thenReturn(Optional.of(comment));
        comments.deleteForAdmin(3L);
        assertEquals(time, comment.getDeletedAt());
    }
}

package com.discuss.discuss.service.comment;

import com.discuss.discuss.dto.comment.UpdateCommentRequestDTO;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.CommentStatus;
import com.discuss.discuss.exception.comment.*;
import com.discuss.discuss.repository.CommentRepository;
import com.discuss.discuss.service.user.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {
    @Mock UserService users;
    @Mock CommentSupport support;
    @Mock CommentRepository repository;
    @InjectMocks CommentService comments;

    private final User author = User.builder().id(1L).build();
    private final Comment comment = Comment.builder().user(author).post(new Post())
            .status(CommentStatus.VISIBLE).content("Original").build();

    @Test
    void rejectsEditingAnotherUsersComment() {
        when(users.getCurrentUser()).thenReturn(User.builder().id(2L).build());
        when(support.visibleComment(3L)).thenReturn(comment);

        assertThatExceptionOfType(CommentException.class)
                .isThrownBy(() -> comments.update(3L, new UpdateCommentRequestDTO("New")))
                .extracting(CommentException::getError).isEqualTo(CommentErrorCode.COMMENT_EDIT_FORBIDDEN);
        assertThat(comment.getContent()).isEqualTo("Original");
        verifyNoInteractions(repository);
    }

    @Test
    void authorDeleteMarksCommentDeletedAndHidesItsContent() {
        when(users.getCurrentUser()).thenReturn(author);
        when(support.visibleComment(3L)).thenReturn(comment);

        comments.delete(3L);

        assertThat(comment.getStatus()).isEqualTo(CommentStatus.DELETED);
        assertThat(comment.getContent()).isEqualTo("[deleted]");
        assertThat(comment.getDeletedAt()).isNotNull();
    }
}

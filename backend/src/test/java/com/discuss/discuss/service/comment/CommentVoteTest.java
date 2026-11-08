package com.discuss.discuss.service.comment;

import com.discuss.discuss.dto.comment.CommentResponseDTO;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.VoteType;
import com.discuss.discuss.repository.*;
import com.discuss.discuss.service.post.PostSupport;
import com.discuss.discuss.service.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CommentVoteTest {
    private final CommentSupport support = mock(CommentSupport.class);
    private final CommentVoteRepository votes = mock(CommentVoteRepository.class);
    private final PostSupport posts = mock(PostSupport.class);
    private final UserService users = mock(UserService.class);
    private final User user = User.builder().id(7L).build();
    private final Post post = new Post();
    private final Comment comment = Comment.builder().id(10L).post(post).build();
    private CommentService service;

    @BeforeEach
    void setup() {
        service = new CommentService(support, mock(CommentRepository.class), votes, posts,
                mock(PostRepository.class), mock(CommentAttachmentService.class), users, null);
        when(users.getCurrentUser()).thenReturn(user);
        when(support.visibleComment(10L)).thenReturn(comment);
        when(votes.findByCommentIdAndUserId(10L, 7L)).thenReturn(Optional.empty());
        when(support.toResponse(comment, user)).thenReturn(new CommentResponseDTO());
    }

    @Test
    void createsVoteForCurrentUser() {
        service.vote(10L, VoteType.UP);
        var saved = ArgumentCaptor.forClass(CommentVote.class);
        verify(votes).save(saved.capture());
        assertSame(comment, saved.getValue().getComment());
        assertSame(user, saved.getValue().getUser());
        assertEquals(VoteType.UP, saved.getValue().getVoteType());
        verify(votes).flush();
    }

    @Test
    void changesDirectionAndRepeatedPutDoesNotCreateAnotherVote() {
        var existing = CommentVote.builder().voteType(VoteType.UP).build();
        when(votes.findByCommentIdAndUserId(10L, 7L)).thenReturn(Optional.of(existing));
        service.vote(10L, VoteType.DOWN);
        service.vote(10L, VoteType.DOWN);
        assertEquals(VoteType.DOWN, existing.getVoteType());
        verify(votes, never()).save(any());
    }

    @Test
    void removesExistingVote() {
        var existing = new CommentVote();
        when(votes.findByCommentIdAndUserId(10L, 7L)).thenReturn(Optional.of(existing));
        service.vote(10L, null);
        verify(votes).delete(existing);
    }

    @Test
    void removingMissingVoteIsIdempotent() {
        service.vote(10L, null);
        verify(votes, never()).delete(any());
        verify(votes, never()).save(any());
    }

    @Test
    void inaccessiblePostCannotReceiveVotes() {
        doThrow(new IllegalStateException("private community")).when(posts).requireRead(post, user);
        assertThrows(IllegalStateException.class, () -> service.vote(10L, VoteType.UP));
        verifyNoInteractions(votes);
    }

    @Test
    void unavailablePostCannotReceiveVotes() {
        doThrow(new IllegalStateException("deleted post")).when(support).requireAvailablePost(post);
        assertThrows(IllegalStateException.class, () -> service.vote(10L, VoteType.UP));
        verifyNoInteractions(votes);
    }

    @Test
    void deletedCommentCannotReceiveVotes() {
        when(support.visibleComment(10L)).thenThrow(new IllegalStateException("deleted comment"));
        assertThrows(IllegalStateException.class, () -> service.vote(10L, VoteType.UP));
        verifyNoInteractions(votes);
    }
}

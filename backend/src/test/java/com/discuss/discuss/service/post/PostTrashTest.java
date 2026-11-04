package com.discuss.discuss.service.post;

import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.repository.*;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.service.media.ImageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostTrashTest {
    @Mock(mockMaker = "mock-maker-subclass") PostRepository postRepository;
    @Mock(mockMaker = "mock-maker-subclass") PostMediaRepository postMediaRepository;
    @Mock(mockMaker = "mock-maker-subclass") UserService userService;
    @Mock(mockMaker = "mock-maker-subclass") ImageService imageService;
    @InjectMocks PostService service;

    private User user(long id) {
        User user = new User();
        user.setId(id);
        return user;
    }
    private Post deleted(User author, Long deletedBy) {
        Post post = new Post();
        post.setId(5L);
        post.setUser(author);
        post.setStatus(PostStatus.DELETED);
        post.setDeletedByUserId(deletedBy);
        return post;
    }
    @Test void rejectsRestoreOfAnotherUsersPost() {
        when(userService.getCurrentUser()).thenReturn(user(1));
        when(postRepository.lockById(5L)).thenReturn(Optional.of(deleted(user(2), 2L)));
        assertThrows(PostException.class, () -> service.restorePost(5L));
    }
    @Test void rejectsRestoreOfModeratedPost() {
        when(userService.getCurrentUser()).thenReturn(user(1));
        when(postRepository.lockById(5L)).thenReturn(Optional.of(deleted(user(1), 2L)));
        assertThrows(PostException.class, () -> service.restorePost(5L));
    }
    @Test void deletionRetainsImagesAndRecordsActor() {
        User author = user(1);
        Post post = deleted(author, null);
        post.setStatus(PostStatus.PUBLISHED);
        when(userService.getCurrentUser()).thenReturn(author);
        when(postRepository.lockById(5L)).thenReturn(Optional.of(post));
        service.deletePost(5L);
        assertEquals(PostStatus.DELETED, post.getStatus());
        assertEquals(1L, post.getDeletedByUserId());
        assertNotNull(post.getDeletedAt());
        verifyNoInteractions(postMediaRepository, imageService);
    }
}

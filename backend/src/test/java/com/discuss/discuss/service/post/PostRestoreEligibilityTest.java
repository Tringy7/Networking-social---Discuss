package com.discuss.discuss.service.post;

import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.User;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PostRestoreEligibilityTest {
    private User user(long id) { User user = new User(); user.setId(id); return user; }
    private Post post(Long deletedBy) {
        Post post = new Post(); post.setUser(user(1)); post.setDeletedByUserId(deletedBy); return post;
    }
    @Test void authorCanRestoreLegacyDeletion() {
        assertTrue(PostService.canRestoreDeletedPost(post(null), user(1)));
    }
    @Test void authorCanRestoreOwnDeletion() {
        assertTrue(PostService.canRestoreDeletedPost(post(1L), user(1)));
    }
    @Test void authorCannotUndoModeration() {
        assertFalse(PostService.canRestoreDeletedPost(post(2L), user(1)));
    }
    @Test void otherUsersCannotRestoreLegacyDeletion() {
        assertFalse(PostService.canRestoreDeletedPost(post(null), user(2)));
    }
}

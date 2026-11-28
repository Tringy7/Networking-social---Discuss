package com.discuss.discuss.service.post;

import com.discuss.discuss.entity.*;
import com.discuss.discuss.exception.community.*;
import com.discuss.discuss.service.community.CommunityAuthorizationService;
import com.discuss.discuss.service.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {
    @Mock UserService users;
    @Mock PostSupport postSupport;
    @Mock CommunityAuthorizationService authorization;
    @InjectMocks PostService posts;

    private final User user = User.builder().id(1L).build();
    private final Community community = Community.builder().id(2L).build();
    private final Post post = Post.builder().community(community).isPinned(false).build();

    @BeforeEach
    void loadPublishedPost() {
        when(users.getCurrentUser()).thenReturn(user);
        when(postSupport.lockPublished(3L)).thenReturn(post);
    }

    @Test
    void pinsAndUnpinsAfterCheckingReadAndModerationPermissions() {
        posts.setPinned(3L, true);
        assertThat(post.getIsPinned()).isTrue();
        posts.setPinned(3L, false);
        assertThat(post.getIsPinned()).isFalse();

        var calls = inOrder(postSupport, authorization);
        calls.verify(postSupport).requireRead(post, user);
        calls.verify(authorization).requireModeratorOrOwner(community, user);
        calls.verify(postSupport).requireRead(post, user);
        calls.verify(authorization).requireModeratorOrOwner(community, user);
    }

    @Test
    void deniedModeratorPermissionLeavesPostUnchanged() {
        doThrow(new CommunityException(CommunityErrorCode.MODERATOR_OR_OWNER_REQUIRED))
                .when(authorization).requireModeratorOrOwner(community, user);

        assertThatThrownBy(() -> posts.setPinned(3L, true)).isInstanceOf(CommunityException.class);
        assertThat(post.getIsPinned()).isFalse();
    }
}

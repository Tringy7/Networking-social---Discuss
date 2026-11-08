package com.discuss.discuss.service.user;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.media.MinioService;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UserSearchServiceTest {
    private final UserRepository users = mock(UserRepository.class);
    private final MinioService media = mock(MinioService.class);
    private final UserSearchService service = new UserSearchService(users, media);
    private final PageRequest page = PageRequest.of(0, 20);

    @Test
    void blankQueryDoesNotListAccounts() {
        assertTrue(service.search("  ", page).isEmpty());
        verifyNoInteractions(users);
    }

    @Test
    void trimsKeywordAndReturnsOnlyPublicProfileFields() {
        var profile = UserProfile.builder().displayName("Nguyễn An").bio("Lập trình viên").avatar("avatar.png").build();
        var user = User.builder().id(7L).username("an").email("private@example.com").profile(profile).build();
        when(users.searchActive("An", page)).thenReturn(new PageImpl<>(List.of(user), page, 1));
        when(media.buildFileUrl("avatar.png")).thenReturn("https://images.example/avatar.png");
        var result = service.search("  An  ", page).getContent().getFirst();
        assertEquals("7", result.id());
        assertEquals("an", result.username());
        assertEquals("Nguyễn An", result.displayName());
        assertEquals("https://images.example/avatar.png", result.avatarUrl());
        verify(users).searchActive("An", page);
    }

    @Test
    void missingProfileFallsBackToUsername() {
        var user = User.builder().id(8L).username("minh").build();
        when(users.searchActive("minh", page)).thenReturn(new PageImpl<>(List.of(user), page, 1));
        var result = service.search("minh", page).getContent().getFirst();
        assertEquals("minh", result.displayName());
        assertNull(result.avatarUrl());
        verifyNoInteractions(media);
    }
}

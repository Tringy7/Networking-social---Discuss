package com.discuss.discuss.service.post;

import com.discuss.discuss.dto.post.*;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.enums.MediaType;
import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.exception.post.PostErrorCode;
import com.discuss.discuss.exception.media.MediaException;
import com.discuss.discuss.exception.community.CommunityException;
import com.discuss.discuss.exception.community.CommunityErrorCode;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.mapper.post.PostMapper;
import com.discuss.discuss.repository.*;
import com.discuss.discuss.service.community.*;
import com.discuss.discuss.service.media.*;
import com.discuss.discuss.service.user.UserService;
import io.minio.StatObjectResponse;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DataJpaTest(showSql = false, properties = {"spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect", "spring.jpa.show-sql=false"})
@Import({PostService.class, PostMapper.class, PageMapper.class, CommunityAuthorizationService.class, ImageService.class, PostImageService.class})
class PostServiceTest {
    @Autowired EntityManager em;
    @Autowired PostService service;
    @Autowired PostRepository posts;
    @Autowired PostContentRepository contents;
    @Autowired PostMediaRepository media;
    @Autowired PostImageUploadRepository uploads;
    @Autowired PostImageService imageService;
    @MockitoBean UserService users;
    @MockitoBean CommunityService communities;
    @MockitoBean MediaStorageService storage;
    @MockitoBean MinioService minio;
    User user;
    Community community;

    @BeforeEach void setUp() {
        user = User.builder().username("minh").email("minh@example.com").role(UserRole.USER).status(UserStatus.ACTIVE).build();
        em.persist(user);
        community = Community.builder().owner(user).name("java").status(CommunityStatus.ACTIVE).visibility(CommunityVisibility.PUBLIC).build();
        em.persist(community);
        em.persist(CommunityMember.builder().community(community).user(user).role(CommunityRole.OWNER).status(MembershipStatus.ACTIVE).build());
        when(users.getCurrentUser()).thenReturn(user);
        when(communities.getCommunityByNameAndStatusActive("java")).thenReturn(community);
        when(storage.isManagedKey(anyString())).thenReturn(true);
        when(minio.buildFileUrl(anyString())).thenAnswer(i -> "https://cdn.example.com/" + i.getArgument(0));
        StatObjectResponse stat = mock(StatObjectResponse.class);
        when(stat.contentType()).thenReturn("image/webp");
        when(minio.stat(anyString())).thenReturn(stat);
        em.flush();
    }
    PostMediaDTO image(String key, String caption) {
        var item = new PostMediaDTO(); item.setType(MediaType.IMAGE); item.setObjectKey(key); item.setCaption(caption); return item;
    }
    CreatePostRequestDTO request(String content, PostMediaDTO... attachments) {
        var input = new CreatePostRequestDTO();
        input.setCommunityName("java"); input.setTitle("Hello"); input.setType(PostType.TEXT);
        input.setContent(content); input.setMedia(List.of(attachments)); input.setTags(List.of(" java ", "java", "spring"));
        return input;
    }
    String upload(String name) {
        String key = "posts/draft-" + user.getId() + "/" + name + ".webp";
        uploads.save(PostImageUpload.builder().objectKey(key).user(user).expiresAt(LocalDateTime.now().plusHours(24)).build());
        return key;
    }
    @Test void persistsDtoWithMarkdownMultipleImagesAndCaptions() {
        String a = upload("a"), b = upload("b");
        String markdown = "# Intro\n\n```java\n  return 1;\n```\n\n```js\nconst a = 1;\n```";
        var result = service.createPost(request(markdown, image(b, "Second"), image(a, "First")));
        em.flush(); em.clear();
        var reloaded = service.getPost(Long.valueOf(result.id()));
        assertEquals(PostType.TEXT, reloaded.type());
        assertEquals(markdown, reloaded.content());
        assertEquals(List.of(b, a), reloaded.media().stream().map(PostResponseDTO.Media::objectKey).toList());
        assertEquals(List.of("Second", "First"), reloaded.media().stream().map(PostResponseDTO.Media::caption).toList());
        assertEquals(List.of(0, 1), reloaded.media().stream().map(PostResponseDTO.Media::position).toList());
        assertEquals(List.of("java", "spring"), reloaded.tags());
        assertEquals(user.getId().toString(), reloaded.author().id());
    }
    @Test void createsImageOnlyTextPost() {
        var result = service.createPost(request(null, image(upload("only"), null)));
        assertEquals(PostType.TEXT, result.type()); assertEquals("", result.content()); assertEquals(1, result.media().size());
    }
    @Test void rejectsLinkPostsWithConfiguredErrorCode() {
        var input = request("Documentation"); input.setType(PostType.LINK);
        var ex = assertThrows(PostException.class, () -> service.createPost(input));
        assertEquals(PostErrorCode.UNSUPPORTED_POST_TYPE, ex.getError());
        assertEquals(0, posts.count());
    }
    @Test void emptyPostUsesConfiguredErrorCode() {
        var ex = assertThrows(PostException.class, () -> service.createPost(request(" ")));
        assertEquals(PostErrorCode.EMPTY_POST, ex.getError());
    }
    @Test void inlineImagesMustBeListedInMediaAndKeepCaption() {
        String key = upload("inline"); String markdown = "Before\n\n![Demo](post-image:" + key + ")\n\nAfter";
        assertThrows(PostException.class, () -> service.createPost(request(markdown)));
        var result = service.createPost(request(markdown, image(key, "Inline image")));
        assertTrue(result.media().getFirst().inlineImage()); assertEquals(markdown, result.content());
    }
    @Test void rejectsDuplicateMediaKeysBeforeWriting() {
        String key = upload("duplicate");
        assertThrows(PostException.class, () -> service.createPost(request("Body", image(key, "a"), image(key, "b"))));
        assertEquals(0, posts.count()); verify(minio, never()).stat(anyString());
    }
    @Test void rejectsAnotherUsersImageBeforeWriting() {
        assertThrows(MediaException.class, () -> service.createPost(request("Body", image("posts/draft-999/stolen.webp", null))));
        assertEquals(0, posts.count()); verify(minio, never()).stat(anyString());
    }
    @Test void rejectsMissingMinioObjectBeforeWriting() {
        String key = upload("missing"); when(minio.stat(key)).thenThrow(new RuntimeException("Missing"));
        assertThrows(MediaException.class, () -> service.createPost(request("Body", image(key, null))));
        assertEquals(0, posts.count());
    }
    @Test void rejectsUnknownCommunity() {
        when(communities.getCommunityByNameAndStatusActive("java")).thenThrow(new CommunityException(CommunityErrorCode.COMMUNITY_NOT_FOUND));
        assertThrows(CommunityException.class, () -> service.createPost(request("Body"))); assertEquals(0, posts.count());
    }
    @Test void rejectsNonMember() {
        em.createQuery("delete from CommunityMember").executeUpdate();
        assertThrows(AccessDeniedException.class, () -> service.createPost(request("Body"))); assertEquals(0, posts.count());
    }
    @Test void editsMediaOrderCaptionAndRemovesReferencesWithoutDeletingObjects() {
        String a = upload("a"), b = upload("b"), c = upload("c");
        Long id = Long.valueOf(service.createPost(request("Body", image(a, "a"), image(b, "b"), image(c, "c"))).id());
        service.updatePost(id, request("Updated Markdown", image(c, "Updated caption"), image(a, "Last")));
        em.flush(); em.clear(); var result = service.getPost(id);
        assertEquals(List.of(c, a), result.media().stream().map(PostResponseDTO.Media::objectKey).toList());
        assertEquals("Updated caption", result.media().getFirst().caption()); assertFalse(media.existsByObjectKey(b));
        assertEquals("Updated Markdown", result.content()); verify(minio, never()).deleteFile(anyString());
    }
    @Test void onlyAuthorCanEditUsingConfiguredPostError() {
        Long id = Long.valueOf(service.createPost(request("Body")).id());
        when(users.getCurrentUser()).thenReturn(User.builder().id(999L).role(UserRole.USER).build());
        var ex = assertThrows(PostException.class, () -> service.updatePost(id, request("Other")));
        assertEquals(PostErrorCode.POST_EDIT_FORBIDDEN, ex.getError());
    }
    @Test void cleanupProtectsAttachedMediaAndSoftDeletedPostsAreNotReadable() {
        String key = upload("attached");
        Long id = Long.valueOf(service.createPost(request("Body", image(key, "Attached"))).id());
        em.flush();
        uploads.findById(key).orElseThrow().setExpiresAt(LocalDateTime.now().minusDays(1)); em.flush();
        imageService.cleanup(); verify(minio, never()).deleteFile(key);
        service.deletePost(id); em.flush();
        uploads.findById(key).orElseThrow().setExpiresAt(LocalDateTime.now().minusDays(1)); em.flush();
        imageService.cleanup(); verify(minio).deleteFile(key); assertFalse(uploads.existsById(key));
        assertThrows(PostException.class, () -> service.getPost(id));
    }
    @Test void rejectsImageAlreadyAttachedToAnotherPost() {
        String key = upload("exclusive");
        service.createPost(request("First", image(key, null)));
        em.flush();
        var ex = assertThrows(PostException.class,
                () -> service.createPost(request("Second", image(key, null))));
        assertEquals(PostErrorCode.DUPLICATE_MEDIA, ex.getError());
    }
    @Test void cleanupOnlyRemovesExpiredUnusedUploadsAndRetriesFailures() {
        String old = upload("old"), fresh = upload("fresh"), fail = upload("fail");
        uploads.findById(old).orElseThrow().setExpiresAt(LocalDateTime.now().minusDays(1));
        uploads.findById(fail).orElseThrow().setExpiresAt(LocalDateTime.now().minusDays(1)); em.flush();
        doThrow(new RuntimeException("Storage down")).when(minio).deleteFile(fail);
        imageService.cleanup(); verify(minio).deleteFile(old); verify(minio, never()).deleteFile(fresh);
        assertTrue(uploads.existsById(fail));
    }
    @Test void privateFeedVisibilityAndSearchRemainCorrect() {
        service.createPost(request("unique_search"));
        assertEquals(1, service.list(null, null, "popular", 0, 1, "unique_search").getTotalElements());
        community.setVisibility(CommunityVisibility.PRIVATE);
        em.createQuery("delete from CommunityMember").executeUpdate(); em.flush();
        assertEquals(0, service.list(null, null, "latest", 0, 20, null).getTotalElements());
    }
    @Test void videoIsNotAcceptedAsAnOwnedImage() {
        var video = new PostMediaDTO(); video.setType(MediaType.VIDEO); video.setObjectKey("posts/draft-12/movie.mp4");
        var ex = assertThrows(PostException.class, () -> service.createPost(request("Video", video)));
        assertEquals(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ex.getError().getStatus()); assertEquals(0, posts.count());
    }
    @Test void votesCanBeNegativeChangedAndRemoved() {
        Long id = Long.valueOf(service.createPost(request("Body")).id());
        var down = service.vote(id, VoteType.DOWN);
        assertEquals(-1, down.voteScore());
        assertEquals(VoteType.DOWN, down.userVote());
        assertEquals(-1, service.vote(id, VoteType.DOWN).voteScore());
        assertEquals(1, service.vote(id, VoteType.UP).voteScore());
        assertEquals(VoteType.UP, service.getPost(id).userVote());
        var removed = service.vote(id, null);
        assertEquals(0, removed.voteScore());
        assertNull(removed.userVote());
        assertEquals(0, service.vote(id, null).voteScore());
    }
    @Test void votesAggregateAcrossUsersAndPopularSortUsesNetScore() {
        Long negative = Long.valueOf(service.createPost(request("Negative")).id());
        Long neutral = Long.valueOf(service.createPost(request("Neutral")).id());
        service.vote(negative, VoteType.UP);
        for (int index = 0; index < 2; index++) {
            User other = User.builder().username("voter" + index).email("voter" + index + "@example.com")
                    .role(UserRole.USER).status(UserStatus.ACTIVE).build();
            em.persist(other);
            when(users.getCurrentUser()).thenReturn(other);
            service.vote(negative, VoteType.DOWN);
        }
        assertEquals(-1, service.getPost(negative).voteScore());
        assertEquals(neutral.toString(), service.list(null, null, "popular", 0, 20, null).getContent().getFirst().id());
    }
    @Test void rejectsVotingOnDeletedOrInaccessiblePosts() {
        Long id = Long.valueOf(service.createPost(request("Body")).id());
        community.setVisibility(CommunityVisibility.PRIVATE);
        em.createQuery("delete from CommunityMember").executeUpdate(); em.flush();
        assertThrows(PostException.class, () -> service.vote(id, VoteType.UP));
    }
}

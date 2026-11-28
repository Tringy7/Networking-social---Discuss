package com.discuss.discuss.controller.post;

import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.PostRepository;
import com.discuss.discuss.repository.PostSaveRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PostControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Autowired JsonMapper json;
    @Autowired PostRepository posts;
    @Autowired PostSaveRepository savedPosts;

    @Test
    void onlyCommunityStaffCanPinAndUnpinPost() throws Exception {
        User owner = user(UserRole.USER);
        User member = user(UserRole.USER);
        Community community = community(owner, CommunityVisibility.PUBLIC);
        addMember(community, member, CommunityRole.MEMBER);
        Post post = publishedPost(owner, community);
        String path = "/posts/" + post.getId() + "/pin";

        mvc.perform(put(path).with(as(member))).andExpect(status().isForbidden());
        assertThat(posts.findById(post.getId()).orElseThrow().getIsPinned()).isFalse();
        mvc.perform(put(path).with(as(owner))).andExpect(status().isNoContent());
        assertThat(posts.findById(post.getId()).orElseThrow().getIsPinned()).isTrue();
        mvc.perform(delete(path).with(as(owner))).andExpect(status().isNoContent());
        assertThat(posts.findById(post.getId()).orElseThrow().getIsPinned()).isFalse();
    }

    @Test
    void showsSavedPostsInSaveOrderAcrossPages() throws Exception {
        User author = user(UserRole.USER);
        Community community = community(author, CommunityVisibility.PUBLIC);
        Post firstPublished = publishedPost(author, community, "First published");
        Post lastPublished = publishedPost(author, community, "Last published");

        mvc.perform(put("/posts/{id}/save", lastPublished.getId()).with(as(author))).andExpect(status().isOk());
        mvc.perform(put("/posts/{id}/save", firstPublished.getId()).with(as(author))).andExpect(status().isOk());

        mvc.perform(get("/posts/saved").param("size", "1").with(as(author)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(firstPublished.getId().toString()));
        mvc.perform(get("/posts/saved").param("page", "1").param("size", "1").with(as(author)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].id").value(lastPublished.getId().toString()));
    }

    @Test
    void postValidationRejectsMissingTitle() throws Exception {
        User member = user(UserRole.USER);
        mvc.perform(body(post("/posts").with(as(member)), """
                {"communityName":"java","type":"TEXT","content":"Example text"}
                """)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.title").exists());
    }

    @Test
    void privatePostIsHiddenFromNonmembersAndAuthorCanRestoreOwnDeletion() throws Exception {
        User author = user(UserRole.USER);
        User outsider = user(UserRole.USER);
        Community community = community(author, CommunityVisibility.PRIVATE);
        var created = mvc.perform(body(post("/posts").with(as(author)), """
                {"communityName":"%s","type":"TEXT","title":"Test post","content":"Original text"}
                """.formatted(community.getName())))
                .andExpect(status().isCreated()).andReturn();
        long id = json.readTree(created.getResponse().getContentAsString()).required("id").asLong();
        String path = "/posts/" + id;

        mvc.perform(get(path).with(as(outsider))).andExpect(status().isNotFound());
        mvc.perform(put(path + "/save").with(as(author))).andExpect(status().isOk());
        mvc.perform(put(path + "/save").with(as(author))).andExpect(status().isOk());
        assertThat(savedPosts.findByPostIdAndUserId(id, author.getId())).isPresent();
        mvc.perform(delete(path + "/save").with(as(author))).andExpect(status().isOk());
        assertThat(savedPosts.findByPostIdAndUserId(id, author.getId())).isEmpty();

        mvc.perform(delete(path).with(as(author))).andExpect(status().isOk());
        assertThat(posts.findById(id).orElseThrow().getStatus()).isEqualTo(PostStatus.DELETED);
        mvc.perform(post(path + "/restore").with(as(author))).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
        assertThat(posts.findById(id).orElseThrow().getDeletedAt()).isNull();
    }

    @Test
    void listsSavedAndTrashedPostsOnlyForTheCurrentUser() throws Exception {
        User author = user(UserRole.USER);
        User another = user(UserRole.USER);
        Community community = community(author, CommunityVisibility.PUBLIC);
        Post saved = publishedPost(author, community, "Saved title");
        Post trashed = publishedPost(author, community, "Trash title");

        mvc.perform(put("/posts/{id}/save", saved.getId()).with(as(author))).andExpect(status().isOk());
        mvc.perform(delete("/posts/{id}", trashed.getId()).with(as(author))).andExpect(status().isOk());
        mvc.perform(get("/posts/saved").with(as(author))).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Saved title"));
        mvc.perform(get("/posts/trash").with(as(author))).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].post.title").value("Trash title"));
        mvc.perform(get("/posts/trash").with(as(another))).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void changesAndRemovesVoteAndFindsPostThroughSearch() throws Exception {
        User author = user(UserRole.USER);
        User voter = user(UserRole.USER);
        Community community = community(author, CommunityVisibility.PUBLIC);
        Post post = publishedPost(author, community, community.getName());

        mvc.perform(body(put("/posts/{id}/vote", post.getId()).with(as(voter)), "{\"type\":\"UP\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.voteScore").value(1));
        mvc.perform(body(put("/posts/{id}/vote", post.getId()).with(as(voter)), "{\"type\":\"DOWN\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.userVote").value("DOWN"))
                .andExpect(jsonPath("$.voteScore").value(-1));
        mvc.perform(delete("/posts/{id}/vote", post.getId()).with(as(voter)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.voteScore").value(0));
        mvc.perform(get("/posts/{id}", post.getId()).with(as(voter)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value(community.getName()));
        mvc.perform(get("/posts").param("tab", "latest").param("q", community.getName()).with(as(voter)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value(community.getName()));
    }

    @Test
    void authorCanEditPostByJsonAndMultipartAndOutsiderCannot() throws Exception {
        User author = user(UserRole.USER);
        User outsider = user(UserRole.USER);
        Community community = community(author, CommunityVisibility.PUBLIC);
        Post post = publishedPost(author, community, "Initial title");
        String edit = "{\"communityName\":\"" + community.getName() + "\",\"title\":\"Edited\",\"type\":\"TEXT\",\"content\":\"Updated content\"}";

        mvc.perform(body(patch("/posts/{id}", post.getId()).with(as(outsider)), edit))
                .andExpect(status().isForbidden());
        mvc.perform(body(patch("/posts/{id}", post.getId()).with(as(author)), edit))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Edited"));
        mvc.perform(multipart(HttpMethod.PATCH, "/posts/{id}", post.getId())
                        .file(jsonPart("post", edit.replace("Edited", "Edited multipart"))).with(as(author)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Edited multipart"));
    }

    @Test
    void createsMultipartPostAndReturnsPersistedImageKey() throws Exception {
        User author = user(UserRole.USER);
        Community community = community(author, CommunityVisibility.PUBLIC);
        var file = new MockMultipartFile("files", "post.png", "image/png", new byte[]{1, 2, 3});
        String key = community.getName() + "/post.png";
        var stored = new StoredImageDTO();
        stored.setObjectKey(key);
        when(images.storePostImage(anyLong(), eq(file))).thenReturn(stored);
        String post = """
                {"communityName":"%s","title":"Multipart post","type":"TEXT","content":"Image",
                 "media":[{"type":"IMAGE","objectKey":"local/image","fileIndex":0}]}
                """.formatted(community.getName());

        mvc.perform(multipart("/posts").file(jsonPart("post", post)).file(file).with(as(author)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.media[0].objectKey").value(key));
    }

    @Test
    void createsVideoOnlyPostAndPersistsVideoAttachment() throws Exception {
        User author = user(UserRole.USER);
        Community community = community(author, CommunityVisibility.PUBLIC);
        var file = new MockMultipartFile("files", "post.mp4", "video/mp4", new byte[]{1, 2, 3});
        String key = community.getName() + "/post.mp4";
        when(images.storePostVideo(anyLong(), eq(file)))
                .thenReturn(new StoredImageDTO(key, "", "video/mp4", 0, 0, 3));
        String post = """
                {"communityName":"%s","title":"Video post","type":"TEXT","content":"",
                 "media":[{"type":"VIDEO","objectKey":"local/video","fileIndex":0}]}
                """.formatted(community.getName());

        mvc.perform(multipart("/posts").file(jsonPart("post", post)).file(file).with(as(author)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.media[0].type").value("VIDEO"))
                .andExpect(jsonPath("$.media[0].objectKey").value(key))
                .andExpect(jsonPath("$.media[0].inlineImage").value(false));
    }
}

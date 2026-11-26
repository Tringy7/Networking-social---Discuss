package com.discuss.discuss.controller.admin;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.PostContent;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.PostContentRepository;
import com.discuss.discuss.repository.PostRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ManagePostControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Autowired PostRepository posts;
    @Autowired PostContentRepository postContents;

    @Test
    void postRemovedByAdminCanOnlyBeRestoredThroughAdminApi() throws Exception {
        User admin = user(UserRole.ADMIN);
        User author = user(UserRole.USER);
        Post post = publishedPost(author, community(author, CommunityVisibility.PUBLIC));
        postContents.save(PostContent.builder().post(post).title("Title").content("Content").build());
        String path = "/admin/posts/" + post.getId();

        mvc.perform(delete(path).with(as(admin))).andExpect(status().isOk());
        assertThat(posts.findById(post.getId()).orElseThrow().isModerationRemoval()).isTrue();
        mvc.perform(post("/posts/{id}/restore", post.getId()).with(as(author))).andExpect(status().isNotFound());
        mvc.perform(patch(path + "/restore").with(as(admin))).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"));
        assertThat(posts.findById(post.getId()).orElseThrow().isModerationRemoval()).isFalse();
    }

    @Test
    void adminCanFilterSearchAndOpenPosts() throws Exception {
        User admin = user(UserRole.ADMIN);
        User author = user(UserRole.USER);
        Community community = community(author, CommunityVisibility.PUBLIC);
        Post post = publishedPost(author, community, community.getName());

        mvc.perform(get("/admin/posts").param("communityName", community.getName()).with(as(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/admin/posts/search").param("search", community.getName()).with(as(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/admin/posts/{id}", post.getId()).with(as(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value(community.getName()));
    }
}

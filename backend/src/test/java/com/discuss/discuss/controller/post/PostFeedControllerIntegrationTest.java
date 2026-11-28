package com.discuss.discuss.controller.post;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PostFeedControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Test
    void limitsFeedsToRequestedAuthorOrCommunity() throws Exception {
        User author = user(UserRole.USER);
        User another = user(UserRole.USER);
        Community first = community(author, CommunityVisibility.PUBLIC);
        Community second = community(another, CommunityVisibility.PUBLIC);
        publishedPost(author, first, "First title");
        publishedPost(another, second, "Other title");

        mvc.perform(get("/communities/{name}/posts", first.getName()).with(as(author)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("First title"));
        mvc.perform(get("/users/{username}/posts", another.getUsername()).with(as(author)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Other title"));
    }
}

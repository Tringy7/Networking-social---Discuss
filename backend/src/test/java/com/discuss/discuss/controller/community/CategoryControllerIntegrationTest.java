package com.discuss.discuss.controller.community;

import com.discuss.discuss.entity.Category;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.CategoryRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CategoryControllerIntegrationTest extends AbstractApiIntegrationTest {
    @Autowired private CategoryRepository categories;

    @Test
    void returnsPersistedCategoryToSignedInUser() throws Exception {
        User viewer = user(UserRole.USER);
        String slug = "topic-" + UUID.randomUUID();
        categories.save(Category.builder().name(slug).slug(slug).build());

        mvc.perform(get("/categories").with(as(viewer))).andExpect(status().isOk())
                .andExpect(jsonPath("$[*].slug", hasItem(slug)));
    }
}

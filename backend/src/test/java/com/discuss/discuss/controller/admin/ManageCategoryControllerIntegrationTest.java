package com.discuss.discuss.controller.admin;

import com.discuss.discuss.entity.Category;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.CategoryRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ManageCategoryControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Autowired CategoryRepository categories;

    @Test
    void adminCanCreateCategoryAndDuplicateSlugIsRejected() throws Exception {
        User admin = user(UserRole.ADMIN);
        String slug = "test-" + UUID.randomUUID();
        String data = """
                {"name":"Java Discussion","slug":"%s"}
                """.formatted(slug);

        mvc.perform(body(post("/admin/categories").with(as(admin)), data))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.slug").value(slug));
        mvc.perform(body(post("/admin/categories").with(as(admin)), data))
                .andExpect(status().isConflict());
        assertThat(categories.findAllSlugs()).contains(slug);
    }

    @Test
    void adminCanListUpdateAndDeleteCategory() throws Exception {
        User admin = user(UserRole.ADMIN);
        String slug = "test-" + UUID.randomUUID();
        Category category = categories.save(Category.builder().name(slug).slug(slug).build());

        mvc.perform(get("/admin/categories").with(as(admin))).andExpect(status().isOk())
                .andExpect(jsonPath("$[*].slug", hasItem(slug)));
        mvc.perform(body(patch("/admin/categories/{id}", category.getId()).with(as(admin)),
                "{\"name\":\"Updated " + slug + "\",\"slug\":\"" + slug + "-new\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.slug").value(slug + "-new"));
        mvc.perform(delete("/admin/categories/{id}", category.getId()).with(as(admin)))
                .andExpect(status().isNoContent());
        assertThat(categories.findById(category.getId())).isEmpty();
    }
}

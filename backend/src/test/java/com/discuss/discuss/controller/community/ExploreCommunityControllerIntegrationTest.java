package com.discuss.discuss.controller.community;

import com.discuss.discuss.entity.Category;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityInfo;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.CategoryRepository;
import com.discuss.discuss.repository.CommunityInfoRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ExploreCommunityControllerIntegrationTest extends AbstractApiIntegrationTest {
    @Autowired private CategoryRepository categories;
    @Autowired private CommunityInfoRepository info;

    @Test
    void appliesCategoryAndNameFiltersToPublicExploreRequests() throws Exception {
        User owner = user(UserRole.USER);
        Community selected = community(owner, CommunityVisibility.PUBLIC);
        Community other = community(owner, CommunityVisibility.PUBLIC);
        String slug = "group-" + UUID.randomUUID();
        Category category = categories.save(Category.builder().name(slug).slug(slug).build());
        CommunityInfo details = info.findByCommunity(selected).orElseThrow();
        details.setCategory(category);
        info.save(details);

        mvc.perform(get("/explore").param("size", "1")).andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
        for (String path : List.of("/categories/{slug}/communities", "/explore/{slug}")) {
            mvc.perform(get(path, slug)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.content[0].name").value(selected.getName()));
        }
        for (String path : List.of("/explore/search", "/communities")) {
            mvc.perform(get(path).param("filter", "name : '" + other.getName() + "'"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.content[0].name").value(other.getName()));
        }
    }
}

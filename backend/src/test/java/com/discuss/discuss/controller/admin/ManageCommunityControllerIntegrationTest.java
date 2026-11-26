package com.discuss.discuss.controller.admin;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.CommunityRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ManageCommunityControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Autowired CommunityRepository communities;

    @Test
    void adminCanLockAndUnlockCommunity() throws Exception {
        User admin = user(UserRole.ADMIN);
        Community community = community(user(UserRole.USER), CommunityVisibility.PUBLIC);
        String path = "/admin/communities/" + community.getId();

        mvc.perform(patch(path + "/lock").with(as(admin))).andExpect(status().isOk());
        assertThat(communities.findById(community.getId()).orElseThrow().getStatus()).isEqualTo(CommunityStatus.BANED);
        mvc.perform(patch(path + "/unlock").with(as(admin))).andExpect(status().isOk());
        assertThat(communities.findById(community.getId()).orElseThrow().getStatus()).isEqualTo(CommunityStatus.ACTIVE);
    }

    @Test
    void adminCanFilterSearchAndOpenCommunities() throws Exception {
        User admin = user(UserRole.ADMIN);
        Community community = community(user(UserRole.USER), CommunityVisibility.PRIVATE);

        mvc.perform(get("/admin/communities").param("visibility", "PRIVATE").with(as(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content").isArray());
        mvc.perform(get("/admin/communities/search").param("search", community.getName()).with(as(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value(community.getName()));
        mvc.perform(get("/admin/communities/{id}", community.getId()).with(as(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value(community.getName()));
    }
}

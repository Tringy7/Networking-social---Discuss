package com.discuss.discuss.controller.admin;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ManageActivityLogControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Test
    void filtersAuditEntriesByActorAndAction() throws Exception {
        User admin = user(UserRole.ADMIN);
        User member = user(UserRole.USER);
        mvc.perform(patch("/admin/users/{id}/lock", member.getId()).with(as(admin))).andExpect(status().isOk());

        mvc.perform(get("/admin/activity-logs").with(as(admin))
                        .param("actorUserId", admin.getId().toString()).param("action", "LOCK_USER"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].action").value("LOCK_USER"));
        mvc.perform(get("/admin/activity-logs").with(as(user(UserRole.USER))))
                .andExpect(status().isForbidden());
    }
}

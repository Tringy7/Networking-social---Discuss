package com.discuss.discuss.controller.admin;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminControllerIntegrationTest extends AbstractApiIntegrationTest {
    @Autowired private UserRepository users;

    @Test
    void reportsStatisticsOnlyToAdmins() throws Exception {
        User admin = user(UserRole.ADMIN);
        User member = user(UserRole.USER);
        long previous = users.count();
        user(UserRole.USER);

        mvc.perform(get("/admin/stats").with(as(member))).andExpect(status().isForbidden());
        mvc.perform(get("/admin/stats").with(as(admin))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.users.total").value(previous + 1))
                .andExpect(jsonPath("$.data.posts.total").isNumber());
    }
}

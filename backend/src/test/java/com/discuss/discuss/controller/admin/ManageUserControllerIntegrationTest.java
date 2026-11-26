package com.discuss.discuss.controller.admin;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.repository.AdminActivityLogRepository;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ManageUserControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Autowired UserRepository users;
    @Autowired AdminActivityLogRepository activity;

    @Test
    void adminOnlyUserLockWritesAuditEntry() throws Exception {
        User admin = user(UserRole.ADMIN);
        User target = user(UserRole.USER);
        String path = "/admin/users/" + target.getId() + "/lock";

        mvc.perform(patch(path)).andExpect(status().isUnauthorized());
        mvc.perform(patch(path).with(as(target))).andExpect(status().isForbidden());
        assertThat(users.findById(target.getId()).orElseThrow().getStatus()).isEqualTo(UserStatus.ACTIVE);

        mvc.perform(patch(path).with(as(admin))).andExpect(status().isOk());
        assertThat(users.findById(target.getId()).orElseThrow().getStatus()).isEqualTo(UserStatus.LOCKED);
        assertThat(activity.findAll()).anySatisfy(log -> {
            assertThat(log.getActorUserId()).isEqualTo(admin.getId());
            assertThat(log.getTargetId()).isEqualTo(target.getId());
            assertThat(log.getAction()).isEqualTo("LOCK_USER");
        });
    }

    @Test
    void adminCanListSearchOpenAndUnlockUsers() throws Exception {
        User admin = user(UserRole.ADMIN);
        User target = user(UserRole.USER);

        mvc.perform(get("/admin/users").param("role", "ADMIN").with(as(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content[0].role").value("ADMIN"));
        mvc.perform(get("/admin/users/search").param("search", target.getUsername()).with(as(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/admin/users/{id}", target.getId()).with(as(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.username").value(target.getUsername()));
        mvc.perform(patch("/admin/users/{id}/lock", target.getId()).with(as(admin))).andExpect(status().isOk());
        mvc.perform(patch("/admin/users/{id}/unlock", target.getId()).with(as(admin))).andExpect(status().isOk());
        assertThat(users.findById(target.getId()).orElseThrow().getStatus()).isEqualTo(UserStatus.ACTIVE);
    }
}

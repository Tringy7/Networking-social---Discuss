package com.discuss.discuss.controller.admin;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ManageReputationControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Test
    void adminCanUpdateStrictlyIncreasingReputationThresholds() throws Exception {
        User admin = user(UserRole.ADMIN);
        String path = "/admin/reputation/thresholds";
        mvc.perform(body(put(path).with(as(admin)), """
                {"contributor":20,"trusted":10,"highlyTrusted":80}
                """)).andExpect(status().isBadRequest());
        mvc.perform(body(put(path).with(as(admin)), """
                {"contributor":10,"trusted":25,"highlyTrusted":80}
                """)).andExpect(status().isOk());
        mvc.perform(get(path).with(as(admin))).andExpect(status().isOk())
                .andExpect(jsonPath("$.trusted").value(25));
    }
}

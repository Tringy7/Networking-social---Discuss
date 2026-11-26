package com.discuss.discuss.controller.user;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserSearchControllerIntegrationTest extends AbstractApiIntegrationTest {
    @Autowired private UserRepository users;

    @Test
    void searchesActiveUsersAndOmitsLockedAccounts() throws Exception {
        User viewer = user(UserRole.USER);
        String keyword = "search_" + UUID.randomUUID().toString().substring(0, 8);
        User active = users.save(User.builder().username(keyword + "_active").email(keyword + "@example.test")
                .role(UserRole.USER).status(UserStatus.ACTIVE).build());
        users.save(User.builder().username(keyword + "_locked").email(keyword + "_locked@example.test")
                .role(UserRole.USER).status(UserStatus.LOCKED).build());

        mvc.perform(get("/users/search").param("q", keyword).with(as(viewer)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].username").value(active.getUsername()));
    }
}

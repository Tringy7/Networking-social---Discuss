package com.discuss.discuss.controller.notification;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CommunityNotificationPreferenceControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Test
    void communityNotificationPreferenceIsPrivateToEachMember() throws Exception {
        User owner = user(UserRole.USER);
        User member = user(UserRole.USER);
        Community community = community(owner, CommunityVisibility.PUBLIC);
        String path = "/communities/" + community.getName() + "/notification-preferences";

        mvc.perform(get(path).with(as(member))).andExpect(status().isForbidden());
        addMember(community, member, CommunityRole.MEMBER);
        mvc.perform(get(path).with(as(member))).andExpect(status().isOk())
                .andExpect(jsonPath("$.newPostEnabled").value(true));
        mvc.perform(body(put(path).with(as(member)), """
                {"newPostEnabled":false}
                """)).andExpect(status().isOk());
        mvc.perform(get(path).with(as(member))).andExpect(status().isOk())
                .andExpect(jsonPath("$.newPostEnabled").value(false));
        mvc.perform(get(path).with(as(owner))).andExpect(status().isOk())
                .andExpect(jsonPath("$.newPostEnabled").value(true));
    }
}

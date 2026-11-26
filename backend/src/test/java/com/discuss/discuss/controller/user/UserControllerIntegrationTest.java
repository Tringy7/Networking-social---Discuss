package com.discuss.discuss.controller.user;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.UserPrivacySettingsRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UserControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Autowired UserPrivacySettingsRepository privacy;

    @Test
    void privacyRequiresSignInAndPersistsOnlyCurrentUsersSettings() throws Exception {
        User owner = user(UserRole.USER);
        User other = user(UserRole.USER);

        mvc.perform(body(patch("/users/me/settings/privacy"), """
                {"showLocation":true}
                """)).andExpect(status().isUnauthorized());

        mvc.perform(body(patch("/users/me/settings/privacy").with(as(owner)), """
                {"showDateOfBirth":true,"showLocation":true}
                """)).andExpect(status().isOk());
        mvc.perform(body(patch("/users/me/settings/privacy").with(as(owner)), """
                {"showLocation":false}
                """)).andExpect(status().isOk())
                .andExpect(jsonPath("$.showDateOfBirth").value(true))
                .andExpect(jsonPath("$.showLocation").value(false));

        assertThat(privacy.findByUser(owner).orElseThrow().isShowLocation()).isFalse();
        assertThat(privacy.findByUser(other)).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"/users/me", "/user/me"})
    void profileEditIsVisibleToItsOwner(String path) throws Exception {
        User owner = user(UserRole.USER);
        mvc.perform(body(patch(path + "/profile").with(as(owner)), """
                {"displayName":"Trí Discuss","bio":"A short introduction"}
                """)).andExpect(status().isOk());
        mvc.perform(get(path).with(as(owner))).andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(owner.getUsername()))
                .andExpect(jsonPath("$.profile.displayName").value("Trí Discuss"))
                .andExpect(jsonPath("$.profile.bio").value("A short introduction"));
    }

    @Test
    void servesPublicProfileAndOnlyListsCurrentUsersCommunities() throws Exception {
        User viewer = user(UserRole.USER);
        User other = user(UserRole.USER);
        Community own = community(viewer, CommunityVisibility.PUBLIC);
        community(other, CommunityVisibility.PUBLIC);

        for (String path : List.of("/users/by-username/{name}", "/user/{name}")) {
            mvc.perform(get(path, other.getUsername()).with(as(viewer))).andExpect(status().isOk())
                    .andExpect(jsonPath("$.username").value(other.getUsername()))
                    .andExpect(jsonPath("$.email").doesNotExist());
        }
        for (String path : List.of("/users/me/communities/owned", "/users/me/communities/joined",
                "/user/me/owned", "/user/me/joined")) {
            mvc.perform(get(path).with(as(viewer))).andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.content[0].name").value(own.getName()));
        }
    }

    @Test
    void avatarAndBannerEndpointsAcceptMultipartForTheCurrentUser() throws Exception {
        User viewer = user(UserRole.USER);
        var file = new MockMultipartFile("file", "avatar.png", "image/png", new byte[]{1, 2, 3});
        for (String path : List.of("/users/me/avatar", "/user/me/avatar",
                "/users/me/banner", "/user/me/banner")) {
            mvc.perform(multipart(HttpMethod.PUT, path).file(file).with(as(viewer)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.username").value(viewer.getUsername()));
        }
        verify(images, org.mockito.Mockito.times(2)).setAvatarForUser(file);
        verify(images, org.mockito.Mockito.times(2)).setBannerForUser(file);
    }
}

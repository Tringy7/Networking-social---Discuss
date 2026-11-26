package com.discuss.discuss.controller.community;

import com.discuss.discuss.entity.Category;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.CategoryRepository;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.repository.CommunityRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CommunityControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Autowired CategoryRepository categories;
    @Autowired CommunityRepository communities;
    @Autowired CommunityMemberRepository members;

    @Test
    void creatingCommunityMakesCreatorOwnerAndOnlyStaffCanEditIt() throws Exception {
        User owner = user(UserRole.USER);
        User outsider = user(UserRole.USER);
        String name = "c_" + UUID.randomUUID().toString().substring(0, 8);
        var category = categories.save(new Category(null, name, name.replace('_', '-')));

        mvc.perform(body(post("/communities").with(as(owner)), """
                {"name":"%s","categoryId":%d,"description":"First description","visibility":"PUBLIC"}
                """.formatted(name, category.getId()))).andExpect(status().isCreated());
        Community community = communities.findByName(name).orElseThrow();
        assertThat(members.findByCommunityAndUser(community, owner).orElseThrow().getRole())
                .isEqualTo(CommunityRole.OWNER);

        String edit = """
                {"description":"Updated description"}
                """;
        mvc.perform(body(patch("/communities/{name}", name).with(as(outsider)), edit))
                .andExpect(status().isForbidden());
        mvc.perform(body(patch("/communities/{name}", name).with(as(owner)), edit))
                .andExpect(status().isOk()).andExpect(jsonPath("$.description").value("Updated description"));
    }

    @Test
    void returnsCommunityDetailsDefaultRulesAndFilteredMembers() throws Exception {
        User owner = user(UserRole.USER);
        Community community = community(owner, CommunityVisibility.PUBLIC);
        addMember(community, user(UserRole.USER), CommunityRole.MEMBER);

        mvc.perform(get("/communities/default-rules").with(as(owner))).andExpect(status().isOk())
                .andExpect(jsonPath("$.rules").isNotEmpty());
        mvc.perform(get("/communities/{name}", community.getName()).with(as(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value(community.getName()));
        mvc.perform(get("/communities/{name}/members", community.getName()).param("role", "OWNER")
                        .with(as(owner))).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].role").value("OWNER"));
    }

    @Test
    void avatarAndBannerRoutesPassImageAndCommunityNameToImageService() throws Exception {
        User owner = user(UserRole.USER);
        Community community = community(owner, CommunityVisibility.PUBLIC);
        var file = new MockMultipartFile("file", "community.png", "image/png", new byte[]{1, 2, 3});

        mvc.perform(multipart(HttpMethod.PUT, "/communities/{name}/avatar", community.getName())
                        .file(file).with(as(owner))).andExpect(status().isOk());
        mvc.perform(multipart(HttpMethod.PUT, "/communities/{name}/banner", community.getName())
                        .file(file).with(as(owner))).andExpect(status().isOk());
        verify(images).setAvatarForCommunity(community.getName(), file);
        verify(images).setBannerForCommunity(community.getName(), file);
    }
}

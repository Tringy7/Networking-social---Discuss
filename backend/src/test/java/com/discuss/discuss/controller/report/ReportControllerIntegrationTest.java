package com.discuss.discuss.controller.report;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.ReportStatus;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.PostReportRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ReportControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Autowired JsonMapper json;
    @Autowired PostReportRepository reports;

    @ParameterizedTest
    @ValueSource(strings = {"/communities/{name}/reports/POST/{id}/resolve", "/reports/community/{name}/POST/{id}/resolve"})
    void ownerCanResolveReportAndMemberCannot(String path) throws Exception {
        User owner = user(UserRole.USER);
        User reporter = user(UserRole.USER);
        Community community = community(owner, CommunityVisibility.PUBLIC);
        addMember(community, reporter, CommunityRole.MEMBER);
        Post post = publishedPost(owner, community);

        MvcResult result = mvc.perform(body(post("/reports").with(as(reporter)), """
                {"targetType":"POST","targetId":%d,"reason":"SPAM"}
                """.formatted(post.getId()))).andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING")).andReturn();
        long id = json.readTree(result.getResponse().getContentAsString()).required("id").asLong();
        String note = """
                {"resolutionNote":" Reviewed post "}
                """;

        mvc.perform(body(patch(path, community.getName(), id).with(as(reporter)), note)).andExpect(status().isForbidden());
        mvc.perform(body(patch(path, community.getName(), id).with(as(owner)), note)).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolutionNote").value("Reviewed post"));
        assertThat(reports.findById(id).orElseThrow().getStatus()).isEqualTo(ReportStatus.RESOLVED);
    }

    @ParameterizedTest
    @ValueSource(strings = {"/communities/{name}/reports/POST/{id}/reject", "/reports/community/{name}/POST/{id}/reject"})
    void listsPersonalAndCommunityReportsAndSupportsRejection(String path) throws Exception {
        User owner = user(UserRole.USER);
        User reporter = user(UserRole.USER);
        Community community = community(owner, CommunityVisibility.PUBLIC);
        addMember(community, reporter, CommunityRole.MEMBER);
        Post post = publishedPost(owner, community);
        MvcResult result = mvc.perform(body(post("/reports").with(as(reporter)),
                "{\"targetType\":\"POST\",\"targetId\":" + post.getId() + ",\"reason\":\"SPAM\"}"))
                .andExpect(status().isCreated()).andReturn();
        long id = json.readTree(result.getResponse().getContentAsString()).required("id").asLong();

        mvc.perform(get("/reports/me").param("type", "POST").with(as(reporter)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/communities/{name}/reports", community.getName()).param("type", "POST").with(as(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/reports/community/{name}/posts", community.getName()).with(as(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/reports/community/{name}/comments", community.getName()).with(as(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(body(patch(path, community.getName(), id).with(as(owner)),
                "{\"resolutionNote\":\"No violation\"}")).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }
}

package com.discuss.discuss.controller.admin;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.PostReport;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.ReportStatus;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.PostReportRepository;
import com.discuss.discuss.repository.PostRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ManageReportControllerIntegrationTest extends AbstractApiIntegrationTest {
    @Autowired private PostReportRepository reports;
    @Autowired private PostRepository posts;

    @Test
    void listsOpensAndModeratesReports() throws Exception {
        User admin = user(UserRole.ADMIN);
        User author = user(UserRole.USER);
        User reporter = user(UserRole.USER);
        Community community = community(author, CommunityVisibility.PUBLIC);
        Post post = publishedPost(author, community, "Reported post");
        PostReport first = report(post, reporter);
        PostReport second = report(publishedPost(author, community, "Another post"), reporter);

        mvc.perform(get("/admin/reports").param("type", "POST").param("communityName", community.getName())
                        .with(as(admin))).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/reports/posts").param("communityName", community.getName()).with(as(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2));
        for (String path : List.of("/reports/comments", "/reports/communities")) {
            mvc.perform(get(path).with(as(admin))).andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
            mvc.perform(get(path).with(as(reporter))).andExpect(status().isForbidden());
        }
        mvc.perform(get("/admin/reports/POST/{id}", first.getId()).with(as(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PENDING"));
        mvc.perform(get("/admin/reports/POST/{id}/target", first.getId()).with(as(admin)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.post.title").value("Reported post"));

        mvc.perform(body(patch("/admin/reports/POST/{id}/reject", first.getId()).with(as(admin)),
                "{\"resolutionNote\":\"No violation\"}")).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
        mvc.perform(body(patch("/admin/reports/POST/{id}/resolve", second.getId()).with(as(admin)),
                "{\"resolutionNote\":\"Confirmed violation\",\"action\":\"REMOVE_POST\"}")).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));
        assertThat(posts.findById(second.getPost().getId()).orElseThrow().isModerationRemoval()).isTrue();
        assertThat(posts.findById(post.getId()).orElseThrow().getStatus()).isEqualTo(PostStatus.PUBLISHED);
    }

    private PostReport report(Post post, User reporter) {
        return reports.save(PostReport.builder().post(post).user(reporter).reason("SPAM")
                .status(ReportStatus.PENDING).build());
    }
}

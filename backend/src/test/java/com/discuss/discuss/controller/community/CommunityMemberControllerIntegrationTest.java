package com.discuss.discuss.controller.community;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityJoinRequest;
import com.discuss.discuss.entity.OutboxEvent;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.MembershipStatus;
import com.discuss.discuss.enums.NotificationEventType;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.repository.CommunityJoinRequestRepository;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.repository.OutboxEventRepository;
import com.discuss.discuss.support.AbstractApiIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CommunityMemberControllerIntegrationTest extends AbstractApiIntegrationTest {

    @Autowired CommunityMemberRepository members;
    @Autowired CommunityJoinRequestRepository joinRequests;
    @Autowired OutboxEventRepository outbox;

    @Test
    void publicJoinCreatesActiveMembership() throws Exception {
        User owner = user(UserRole.USER);
        User applicant = user(UserRole.USER);
        Community community = community(owner, CommunityVisibility.PUBLIC);
        mvc.perform(post("/communities/{name}/members", community.getName()).with(as(applicant)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.currentUserRole").value("MEMBER"))
                .andExpect(jsonPath("$.joinRequestPending").value(false));

        assertThat(members.findByCommunityAndUser(community, applicant).orElseThrow().getStatus())
                .isEqualTo(MembershipStatus.ACTIVE);
    }

    @Test
    void privateJoinWaitsForStaffApprovalAndEnqueuesNotifications() throws Exception {
        User owner = user(UserRole.USER);
        User applicant = user(UserRole.USER);
        Community community = community(owner, CommunityVisibility.PRIVATE);

        mvc.perform(post("/communities/{name}/members", community.getName()).with(as(applicant)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.joinRequestPending").value(true));
        assertThat(members.findByCommunityAndUser(community, applicant)).isEmpty();
        var pending = joinRequests.findByCommunityAndApplicantAndStatus(
                community, applicant, CommunityJoinRequest.Status.PENDING).orElseThrow();
        String path = "/communities/" + community.getName() + "/join-requests/" + pending.getId();

        mvc.perform(body(patch(path).with(as(applicant)), """
                {"approved":true}
                """)).andExpect(status().isForbidden());
        mvc.perform(body(patch(path).with(as(owner)), """
                {"approved":true}
                """)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED"));

        assertThat(members.findByCommunityAndUser(community, applicant).orElseThrow().getStatus())
                .isEqualTo(MembershipStatus.ACTIVE);
        assertThat(outbox.findAll().stream().filter(event -> community.getId().equals(event.getCommunityId())))
                .extracting(OutboxEvent::getEventType)
                .containsExactlyInAnyOrder(NotificationEventType.COMMUNITY_JOIN_REQUESTED,
                        NotificationEventType.COMMUNITY_JOIN_APPROVED);
    }

    @Test
    void ownerManagesModeratorAndTransfersOwnership() throws Exception {
        User owner = user(UserRole.USER);
        User member = user(UserRole.USER);
        Community community = community(owner, CommunityVisibility.PUBLIC);
        addMember(community, member, CommunityRole.MEMBER);
        String moderator = "/communities/{name}/moderators/{user}";

        mvc.perform(put(moderator, community.getName(), member.getUsername()).with(as(member)))
                .andExpect(status().isForbidden());
        mvc.perform(put(moderator, community.getName(), member.getUsername()).with(as(owner)))
                .andExpect(status().isOk());
        assertThat(members.findByCommunityAndUser(community, member).orElseThrow().getRole())
                .isEqualTo(CommunityRole.MODERATOR);
        mvc.perform(delete(moderator, community.getName(), member.getUsername()).with(as(owner)))
                .andExpect(status().isOk());
        assertThat(members.findByCommunityAndUser(community, member).orElseThrow().getRole())
                .isEqualTo(CommunityRole.MEMBER);

        mvc.perform(body(put("/communities/{name}/owner", community.getName()).with(as(owner)),
                "{\"username\":\"" + member.getUsername() + "\"}")).andExpect(status().isNoContent());
        assertThat(members.findByCommunityAndUser(community, member).orElseThrow().getRole())
                .isEqualTo(CommunityRole.OWNER);
        assertThat(members.findByCommunityAndUser(community, owner).orElseThrow().getRole())
                .isEqualTo(CommunityRole.MODERATOR);
    }

    @Test
    void supportsVoluntaryDepartureAndRemovalByOwner() throws Exception {
        User owner = user(UserRole.USER);
        User leaving = user(UserRole.USER);
        User removed = user(UserRole.USER);
        Community community = community(owner, CommunityVisibility.PUBLIC);
        addMember(community, leaving, CommunityRole.MEMBER);
        addMember(community, removed, CommunityRole.MEMBER);

        mvc.perform(delete("/communities/{name}/members/me", community.getName()).with(as(leaving)))
                .andExpect(status().isOk());
        mvc.perform(delete("/communities/{name}/members/{user}", community.getName(), removed.getUsername())
                        .with(as(owner))).andExpect(status().isOk());
        assertThat(members.findByCommunityAndUser(community, leaving).orElseThrow().getStatus())
                .isEqualTo(MembershipStatus.LEFT);
        assertThat(members.findByCommunityAndUser(community, removed).orElseThrow().getStatus())
                .isEqualTo(MembershipStatus.KICKED);
    }

    @Test
    void exposesJoinQueueOnlyToStaff() throws Exception {
        User owner = user(UserRole.USER);
        User applicant = user(UserRole.USER);
        Community community = community(owner, CommunityVisibility.PRIVATE);
        mvc.perform(post("/communities/{name}/members", community.getName()).with(as(applicant)))
                .andExpect(status().isAccepted());

        mvc.perform(get("/communities/{name}/join-requests", community.getName()).with(as(applicant)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/communities/{name}/join-requests", community.getName()).with(as(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].status").value("PENDING"));
    }
}

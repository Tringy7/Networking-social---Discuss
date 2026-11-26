package com.discuss.discuss.service.report;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.exception.report.*;
import com.discuss.discuss.service.community.*;
import com.discuss.discuss.service.user.UserService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportReviewServiceTest {
    @Mock EntityManager entities;
    @Mock UserService users;
    @Mock CommunitySupport communities;
    @Mock CommunityAuthorizationService authorization;
    @InjectMocks ReportReviewService reviews;

    @Test
    void communityReviewCannotHandleReportsAboutTheCommunityItself() {
        assertThatExceptionOfType(ReportException.class)
                .isThrownBy(() -> reviews.reviewForCommunity("java", ReportTargetType.COMMUNITY, 1L,
                        ReportStatus.RESOLVED, "Reviewed"))
                .extracting(ReportException::getError).isEqualTo(ReportErrorCode.INVALID_COMMUNITY_REPORT_TYPE);
        verifyNoInteractions(users, entities);
    }

    @Test
    void requiresOwnerAndRejectsBlankDecisionNoteBeforeAccessingReport() {
        User owner = User.builder().id(1L).build();
        Community community = Community.builder().id(2L).build();
        when(users.getCurrentUser()).thenReturn(owner);
        when(communities.getCommunityByName("java")).thenReturn(community);

        assertThatExceptionOfType(ReportException.class)
                .isThrownBy(() -> reviews.reviewForCommunity("java", ReportTargetType.POST, 3L,
                        ReportStatus.REJECTED, " "))
                .extracting(ReportException::getError).isEqualTo(ReportErrorCode.INVALID_REVIEW_NOTE);
        verify(authorization).requireOwner(community, owner);
        verifyNoInteractions(entities);
    }
}

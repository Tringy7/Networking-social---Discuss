package com.discuss.discuss.service.community;

import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.exception.community.*;
import com.discuss.discuss.repository.CommunityMemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class CommunityAuthorizationServiceTest {
    private final CommunityMemberRepository members = mock(CommunityMemberRepository.class);
    private final CommunityAuthorizationService authorization = new CommunityAuthorizationService(members);
    private final User user = User.builder().id(1L).build();
    private final Community community = Community.builder().status(CommunityStatus.ACTIVE)
            .visibility(CommunityVisibility.PUBLIC).build();

    @Test
    void allowsPublicCommentFromNonmemberButDeniesPrivateComment() {
        authorization.requireCommentPermission(community, user);

        community.setVisibility(CommunityVisibility.PRIVATE);
        assertThatExceptionOfType(CommunityException.class)
                .isThrownBy(() -> authorization.requireCommentPermission(community, user))
                .extracting(CommunityException::getError).isEqualTo(CommunityErrorCode.ACTIVE_MEMBERSHIP_REQUIRED);
    }

    @Test
    void rejectsBannedMemberEvenInPublicCommunity() {
        when(members.findByCommunityAndUser(community, user)).thenReturn(
                Optional.of(CommunityMember.builder().status(MembershipStatus.BANNED).build()));

        assertThatExceptionOfType(CommunityException.class)
                .isThrownBy(() -> authorization.requireCommentPermission(community, user))
                .extracting(CommunityException::getError).isEqualTo(CommunityErrorCode.MEMBER_BANNED);
    }

    @ParameterizedTest
    @EnumSource(value = CommunityRole.class, names = {"MODERATOR", "OWNER"})
    void permitsActiveStaffToModerate(CommunityRole role) {
        when(members.findByCommunityAndUserAndStatus(community, user, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(CommunityMember.builder().role(role).build()));

        authorization.requireModeratorOrOwner(community, user);
    }
}

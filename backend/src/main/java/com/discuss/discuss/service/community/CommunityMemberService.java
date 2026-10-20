
package com.discuss.discuss.service.community;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.MembershipStatus;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommunityMemberService {

    private final CommunityMemberRepository memberRepository;
    private final UserService userService;

    @Transactional
    public CommunityMember addOwner(
            Community community,
            User user
    ) {
        CommunityMember owner = CommunityMember.builder()
                .community(community)
                .user(user)
                .role(CommunityRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();

        return memberRepository.save(owner);
    }

    public long countActiveMembers(Community community) {
        return memberRepository.countByCommunityAndStatus(
                community,
                MembershipStatus.ACTIVE
        );
    }


    public List<CommunityMember> getStaffMembers(Community community) {
        return memberRepository.findStaffMembers(
                community,
                List.of(CommunityRole.OWNER, CommunityRole.MODERATOR),
                MembershipStatus.ACTIVE
        );
    }
}

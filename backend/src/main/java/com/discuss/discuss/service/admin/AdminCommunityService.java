package com.discuss.discuss.service.admin;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.community.CommunityDetailResponseDTO;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@HasRole("ADMIN")
public class AdminCommunityService {
    private final CommunityService communityService;
    private final ActivityLogService activityLogService;

    public PageResponseDTO<CommunityDetailResponseDTO> getCommunities(
            Pageable pageable, CommunityStatus status, CommunityVisibility visibility) {
        return communityService.getCommunities(pageable, status, visibility);
    }

    public PageResponseDTO<CommunityDetailResponseDTO> searchCommunities(
            Pageable pageable, String search, CommunityStatus status, CommunityVisibility visibility) {
        return communityService.searchCommunities(pageable, search, status, visibility);
    }

    public CommunityDetailResponseDTO getCommunityDetail(Long communityId) {
        return communityService.getCommunityDetailById(communityId);
    }

    @Transactional
    public void lockCommunity(Long communityId) {
        if (communityService.updateStatus(communityId, CommunityStatus.BANED)) {
            activityLogService.record("LOCK_COMMUNITY", "COMMUNITY", communityId, null);
        }
    }

    @Transactional
    public void unlockCommunity(Long communityId) {
        if (communityService.updateStatus(communityId, CommunityStatus.ACTIVE)) {
            activityLogService.record("UNLOCK_COMMUNITY", "COMMUNITY", communityId, null);
        }
    }
}

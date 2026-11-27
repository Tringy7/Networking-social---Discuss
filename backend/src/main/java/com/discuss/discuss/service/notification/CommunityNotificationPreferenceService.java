package com.discuss.discuss.service.notification;

import com.discuss.discuss.entity.CommunityNotificationPreference;
import com.discuss.discuss.repository.CommunityNotificationPreferenceRepository;
import com.discuss.discuss.service.community.CommunityAuthorizationService;
import com.discuss.discuss.service.community.CommunitySupport;
import com.discuss.discuss.service.user.UserService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommunityNotificationPreferenceService {
    private final UserService users;
    private final CommunitySupport communities;
    private final CommunityAuthorizationService authorization;
    private final CommunityNotificationPreferenceRepository repository;

    @Transactional(readOnly = true)
    public boolean isNewPostNotificationEnabled(String name) {
        return repository.findById(requireActiveMembershipKey(name))
                .map(CommunityNotificationPreference::isNewPostEnabled).orElse(true);
    }

    @Transactional
    public void updateNewPostNotificationPreference(String name, boolean enabled) {
        var key = requireActiveMembershipKey(name);
        repository.savePreference(key.userId(), key.communityId(), enabled, LocalDateTime.now());
    }

    private CommunityNotificationPreference.Key requireActiveMembershipKey(String name) {
        var user = users.getCurrentUser();
        var community = communities.getCommunityByNameAndStatusActive(name);
        authorization.requireMembership(community, user);
        return new CommunityNotificationPreference.Key(user.getId(), community.getId());
    }
}

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
    public boolean isNewPostEnabled(String name) {
        return repository.findById(memberKey(name))
                .map(CommunityNotificationPreference::isNewPostEnabled).orElse(true);
    }

    @Transactional
    public void update(String name, boolean enabled) {
        var key = memberKey(name);
        repository.savePreference(key.userId(), key.communityId(), enabled, LocalDateTime.now());
    }

    private CommunityNotificationPreference.Key memberKey(String name) {
        var user = users.getCurrentUser();
        var community = communities.getCommunityByNameAndStatusActive(name);
        authorization.requireMembership(community, user);
        return new CommunityNotificationPreference.Key(user.getId(), community.getId());
    }
}

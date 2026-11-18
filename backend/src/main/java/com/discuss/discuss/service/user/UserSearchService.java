package com.discuss.discuss.service.user;

import com.discuss.discuss.dto.user.UserSearchResultDTO;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.repository.UserRepository;
import com.discuss.discuss.service.media.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSearchService {
    private final UserRepository users;
    private final UserSpecifications userSpecifications;
    private final MinioService minio;

    @Transactional(readOnly = true)
    public Page<UserSearchResultDTO> search(String query, Pageable pageable) {
        String keyword = query == null ? "" : query.strip();
        if (keyword.isEmpty()) return Page.empty(pageable);
        var specification = userSpecifications.hasStatus(UserStatus.ACTIVE)
                .and(userSpecifications.matchesUsernameOrDisplayName(keyword));
        return users.findAll(specification, pageable).map(user -> {
            var profile = user.getProfile();
            String displayName = profile == null || profile.getDisplayName() == null || profile.getDisplayName().isBlank()
                    ? user.getUsername() : profile.getDisplayName();
            return new UserSearchResultDTO(user.getId().toString(), user.getUsername(), displayName,
                    profile == null ? null : profile.getBio(),
                    profile == null || profile.getAvatar() == null ? null : minio.buildFileUrl(profile.getAvatar()));
        });
    }
}

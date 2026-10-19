package com.discuss.discuss.service.media;

import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.entity.CommunityInfo;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.enums.ImageKind;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.repository.CommunityInfoRepository;
import com.discuss.discuss.repository.UserProfileRepository;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronizationAdapter;
import org.springframework.web.multipart.MultipartFile;

import java.util.function.BiConsumer;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final MediaStorageService storage;
    private final UserService userService;
    private final UserProfileRepository profileRepository;
    private final CommunityInfoRepository communityInfoRepository;

    // ==================== USER ====================

    @Transactional
    public StoredImageDTO setAvatarForUser(MultipartFile file) {
        User user = userService.getCurrentUser();

        UserProfile profile = profileRepository.findByUser(user)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND));

        return replace(
                ImageKind.AVATAR,
                file,
                user.getId(),
                profile,
                UserProfile::getAvatar,
                UserProfile::setAvatar,
                profileRepository::save
        );
    }

    @Transactional
    public StoredImageDTO setBannerForUser(MultipartFile file) {
        User user = userService.getCurrentUser();

        UserProfile profile = profileRepository.findByUser(user)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND));

        return replace(
                ImageKind.PROFILE_BANNER,
                file,
                user.getId(),
                profile,
                UserProfile::getBanner,
                UserProfile::setBanner,
                profileRepository::save
        );
    }

    // ==================== COMMUNITY ====================

    @Transactional
    public StoredImageDTO setAvatarForCommunity(
            Long communityId,
            MultipartFile file
    ) {
        CommunityInfo info = communityInfoRepository
                .findByCommunityId(communityId)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND));

        return replace(
                ImageKind.COMMUNITY_AVATAR,
                file,
                communityId,
                info,
                CommunityInfo::getAvatar,
                CommunityInfo::setAvatar,
                communityInfoRepository::save
        );
    }

    @Transactional
    public StoredImageDTO setBannerForCommunity(
            Long communityId,
            MultipartFile file
    ) {
        CommunityInfo info = communityInfoRepository
                .findByCommunityId(communityId)
                .orElseThrow(() ->
                        new AuthException(AuthErrorCode.USER_NOT_FOUND));

        return replace(
                ImageKind.COMMUNITY_BANNER,
                file,
                communityId,
                info,
                CommunityInfo::getBanner,
                CommunityInfo::setBanner,
                communityInfoRepository::save
        );
    }

    // ==================== SHARED ====================

    private <T> StoredImageDTO replace(
            ImageKind kind,
            MultipartFile file,
            Object ownerId,
            T entity,
            Function<T, String> getter,
            BiConsumer<T, String> setter,
            Function<T, T> saver
    ) {
        String ownerPrefix = kind.prefixFor(ownerId);
        String oldKey = getter.apply(entity);

        StoredImageDTO stored = storage.store(kind, ownerId, file);

        try {
            setter.accept(entity, stored.getObjectKey());
            saver.apply(entity);
        } catch (RuntimeException ex) {
            storage.safeDelete(stored.getObjectKey());
            throw ex;
        }

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {

                    @Override
                    public void afterCommit() {
                        if (oldKey != null
                                && oldKey.startsWith(ownerPrefix)
                                && !oldKey.equals(stored.getObjectKey())) {
                            storage.safeDelete(oldKey);
                        }
                    }

                    @Override
                    public void afterCompletion(int status) {
                        if (status == STATUS_ROLLED_BACK) {
                            storage.safeDelete(stored.getObjectKey());
                        }
                    }
                }
        );

        return stored;
    }
}
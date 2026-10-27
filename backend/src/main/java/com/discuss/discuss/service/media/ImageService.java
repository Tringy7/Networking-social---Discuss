package com.discuss.discuss.service.media;

import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.enums.ImageKind;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
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

    // ==================== USER ====================
    @Transactional
    public void setAvatarForUser(MultipartFile file) {
        User user = userService.getCurrentUser();

        UserProfile profile = profileRepository.findByUser(user)
                .orElseThrow(()
                        -> new AuthException(AuthErrorCode.USER_NOT_FOUND));

        this.replace(
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
    public void setBannerForUser(MultipartFile file) {
        User user = userService.getCurrentUser();

        UserProfile profile = profileRepository.findByUser(user)
                .orElseThrow(()
                        -> new AuthException(AuthErrorCode.USER_NOT_FOUND));

        this.replace(
                ImageKind.PROFILE_BANNER,
                file,
                user.getId(),
                profile,
                UserProfile::getBanner,
                UserProfile::setBanner,
                profileRepository::save
        );
    }

    // ==================== SHARED ====================
    private <T> void replace(
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
    }
}

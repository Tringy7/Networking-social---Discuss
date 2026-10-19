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
import org.springframework.web.multipart.MultipartFile;

import java.util.function.BiConsumer;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class ProfileImageService {

    private final MediaStorageService storage;
    private final UserService userService;
    private final UserProfileRepository profileRepository;

    @Transactional
    public StoredImageDTO setAvatar(MultipartFile file) {
        return replace(ImageKind.AVATAR, file,
                UserProfile::getAvatarObjectKey, UserProfile::setAvatarObjectKey);
    }

    @Transactional
    public StoredImageDTO setBanner(MultipartFile file) {
        return replace(ImageKind.PROFILE_BANNER, file,
                UserProfile::getBannerObjectKey, UserProfile::setBannerObjectKey);
    }

    private StoredImageDTO replace(ImageKind kind,
                                   MultipartFile file,
                                   Function<UserProfile, String> getter,
                                   BiConsumer<UserProfile, String> setter) {
        User user = userService.getCurrentUser();
        StoredImageDTO stored = storage.store(kind, user.getId(), file);

        UserProfile profile = profileRepository.findByUser(user).orElseThrow(() -> {
            storage.safeDelete(stored.getObjectKey());
            return new AuthException(AuthErrorCode.USER_NOT_FOUND);
        });

        String oldKey = getter.apply(profile);
        String ownerPrefix = kind.prefixFor(user.getId());

        setter.accept(profile, stored.getObjectKey());
        profileRepository.save(profile);

        // Xóa ảnh cũ sau commit, xóa ảnh mới nếu rollback
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                if (oldKey != null && oldKey.startsWith(ownerPrefix)) {
                    storage.safeDelete(oldKey);
                }
            }

            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    storage.safeDelete(stored.getObjectKey());
                }
            }
        });

        return stored;
    }
}
package com.discuss.discuss.service.media;

import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserProfile;
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

@Service
@RequiredArgsConstructor
public class AvatarService {

    private final MediaStorageService storage;
    private final UserService userService;
    private final UserProfileRepository profileRepository;


    @Transactional
    public StoredImageDTO setAvatar(MultipartFile file) {
        User user = userService.getCurrentUser();

        var stored = storage.storeAvatar(user.getId(), file);
        UserProfile profile = findProfile(user, stored);

        String oldAvatar = profile.getAvatarObjectKey();
        profile.setAvatarObjectKey(stored.getObjectKey());
        profileRepository.save(profile);

        cleanupAfterTransaction(user.getId(), oldAvatar, stored.getObjectKey());
        return stored;
    }

    private UserProfile findProfile(User user, StoredImageDTO stored) {
        return profileRepository.findByUser(user).orElseThrow(() -> {
            storage.safeDelete(stored.getObjectKey());
            return new AuthException(AuthErrorCode.USER_NOT_FOUND);
        });
    }

    private void cleanupAfterTransaction(Long userId, String oldAvatar, String newAvatar) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                if (isOwnedAvatar(oldAvatar, userId)) {
                    storage.safeDelete(oldAvatar);
                }
            }

            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    storage.safeDelete(newAvatar);
                }
            }
        });
    }

    /** Chỉ avatar nằm trong thư mục của chính user mới được xóa (tránh xóa ảnh mặc định/dùng chung). */
    private boolean isOwnedAvatar(String key, Long userId) {
        return key != null && key.startsWith("avatars/" + userId + "/");
    }
}
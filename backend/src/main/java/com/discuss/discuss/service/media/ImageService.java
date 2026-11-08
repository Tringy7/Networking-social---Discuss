package com.discuss.discuss.service.media;

import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.dto.media.StoredCommentImageDTO;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityInfo;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.enums.ImageKind;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.repository.CommunityInfoRepository;
import com.discuss.discuss.repository.UserProfileRepository;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.function.BiConsumer;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageService {

    private final MediaStorageService storage;
    private final UserService userService;
    private final CommunityService communityService;
    private final UserProfileRepository profileRepository;
    private final CommunityInfoRepository communityInfoRepository;

    // ==================== USER ====================
    @Transactional
    public void setAvatarForUser(MultipartFile file) {
        User user = userService.getCurrentUser();
        UserProfile profile = profileRepository.findByUser(user)
                .orElseThrow(() -> new AuthException(AuthErrorCode.USER_NOT_FOUND));

        replace(ImageKind.AVATAR, file, user.getId(), profile,
                UserProfile::getAvatar, UserProfile::setAvatar, profileRepository::save);
    }

    @Transactional
    public void setBannerForUser(MultipartFile file) {
        User user = userService.getCurrentUser();
        UserProfile profile = profileRepository.findByUser(user)
                .orElseThrow(() -> new AuthException(AuthErrorCode.USER_NOT_FOUND));

        replace(ImageKind.PROFILE_BANNER, file, user.getId(), profile,
                UserProfile::getBanner, UserProfile::setBanner, profileRepository::save);
    }

    // ==================== COMMUNITY ====================
    @Transactional
    public void setAvatarForCommunity(String communityName, MultipartFile file) {
        Community community = communityService.getCommunityByNameAndStatusActive(communityName);
        CommunityInfo info = community.getInfo();

        replace(ImageKind.COMMUNITY_AVATAR, file, community.getId(), info,
                CommunityInfo::getAvatar, CommunityInfo::setAvatar, communityInfoRepository::save);
    }

    @Transactional
    public void setBannerForCommunity(String communityName, MultipartFile file) {
        Community community = communityService.getCommunityByNameAndStatusActive(communityName);
        CommunityInfo info = community.getInfo();

        replace(ImageKind.COMMUNITY_BANNER, file, community.getId(), info,
                CommunityInfo::getBanner, CommunityInfo::setBanner, communityInfoRepository::save);
    }

    // ==================== POST ====================
    @Transactional(propagation = Propagation.MANDATORY)
    public StoredImageDTO storePostImage(Long postId, MultipartFile file) {
        return storage.storePostImage(postId, file, this::deleteUncommittedImage);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void deletePostImageAfterCommit(String key) {
        deleteAfterCommit(key);
    }

    // ==================== COMMENT ====================
    public void validateCommentImages(List<MultipartFile> images) {
        storage.validateCommentImages(images);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public StoredCommentImageDTO storeCommentImage(Long commentId, MultipartFile file) {
        return storage.storeCommentImage(commentId, file, this::deleteUncommittedImage);
    }

    private void deleteUncommittedImage(String key) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    storage.safeDelete(key);
                }
            }
        });
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
        String newKey = stored.getObjectKey();

        // Đăng ký NGAY sau khi store: mọi lỗi phía sau (setter/save/commit) đều rollback và xóa ảnh mới.
        deleteOnRollback(newKey);

        setter.accept(entity, newKey);
        saver.apply(entity);

        if (oldKey != null && oldKey.startsWith(ownerPrefix) && !oldKey.equals(newKey)) {
            deleteAfterCommit(oldKey);
        }
    }

    private void deleteAfterCommit(String key) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                storage.safeDelete(key);
            }
        });
    }

    private void deleteOnRollback(String key) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_ROLLED_BACK) {
                    storage.safeDelete(key);
                }
            }
        });
    }

}

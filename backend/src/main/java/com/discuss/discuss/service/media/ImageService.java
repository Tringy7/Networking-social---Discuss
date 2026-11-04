package com.discuss.discuss.service.media;

import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityInfo;
import com.discuss.discuss.entity.PostImageUpload;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserProfile;
import com.discuss.discuss.enums.ImageKind;
import com.discuss.discuss.exception.auth.AuthErrorCode;
import com.discuss.discuss.exception.auth.AuthException;
import com.discuss.discuss.exception.media.MediaErrorCode;
import com.discuss.discuss.exception.media.MediaException;
import com.discuss.discuss.repository.CommunityInfoRepository;
import com.discuss.discuss.repository.PostImageUploadRepository;
import com.discuss.discuss.repository.PostMediaRepository;
import com.discuss.discuss.repository.UserProfileRepository;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Objects;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageService {

    private static final Duration POST_LEASE = Duration.ofHours(24);
    private static final int CLEANUP_BATCH_SIZE = 100;
    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp");

    private final MediaStorageService storage;
    private final MinioService minio;
    private final UserService userService;
    private final CommunityService communityService;
    private final UserProfileRepository profileRepository;
    private final CommunityInfoRepository communityInfoRepository;
    private final PostImageUploadRepository uploads;
    private final PostMediaRepository media;
    private final PlatformTransactionManager transactionManager;

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

    // ==================== POST: UPLOAD ====================
    /** Không @Transactional: lease phải commit độc lập TRƯỚC khi ghi MinIO. */
    public StoredImageDTO uploadPostImage(MultipartFile file) {
        User user = userService.getCurrentUser();
        TransactionTemplate reservation = newTx(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        return storage.storePostDraft(user.getId(), file, key ->
                reservation.executeWithoutResult(status ->
                        uploads.saveAndFlush(PostImageUpload.builder()
                                .objectKey(key)
                                .user(user)
                                .expiresAt(LocalDateTime.now().plus(POST_LEASE))
                                .build())));
    }

    // ==================== POST: CLAIM / RELEASE ====================
    /** Chạy trong transaction của caller. Lock key theo thứ tự cố định để tránh deadlock. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void validateAndLockPostImages(Collection<String> keys, User user) {
        String ownerPrefix = "posts/draft-" + user.getId() + "/";

        keys.stream().filter(Objects::nonNull).distinct().sorted().forEach(key -> {
            if (!storage.isManagedKey(key) || !key.startsWith(ownerPrefix)) {
                throw new MediaException(MediaErrorCode.MEDIA_ACCESS_DENIED);
            }

            PostImageUpload upload = uploads.lockByKey(key)
                    .orElseThrow(() -> new MediaException(MediaErrorCode.UPLOAD_NOT_FOUND));

            if (!Objects.equals(upload.getUser().getId(), user.getId())) {
                throw new MediaException(MediaErrorCode.MEDIA_ACCESS_DENIED);
            }
            if (upload.getExpiresAt().isBefore(LocalDateTime.now()) && !media.existsByObjectKey(key)) {
                throw new MediaException(MediaErrorCode.UPLOAD_EXPIRED);
            }

            verifyStoredContentType(key);
            upload.setExpiresAt(LocalDateTime.now().plus(POST_LEASE));
        });
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void releasePostImages(Collection<String> keys) {
        keys.stream().filter(Objects::nonNull).distinct().sorted().forEach(key ->
                uploads.lockByKey(key).ifPresent(upload ->
                        upload.setExpiresAt(LocalDateTime.now().plus(POST_LEASE))));
    }

    // ==================== POST: CLEANUP ====================
    @Scheduled(fixedDelayString = "${media.post-image.cleanup-delay-ms:3600000}",
            initialDelayString = "${media.post-image.cleanup-delay-ms:3600000}")
    public void cleanupExpiredPostImages() {
        LocalDateTime now = LocalDateTime.now();
        TransactionTemplate tx = newTx(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        // Mỗi key 1 transaction: lock ngắn, 1 key lỗi không rollback cả batch.
        for (String key : uploads.findExpiredKeys(now, PageRequest.of(0, CLEANUP_BATCH_SIZE))) {
            try {
                tx.executeWithoutResult(status -> cleanupOne(key, now));
            } catch (RuntimeException ex) {
                log.warn("Post image cleanup failed for {}", key, ex); // giữ row để retry
            }
        }
    }

    private void cleanupOne(String key, LocalDateTime now) {
        PostImageUpload upload = uploads.lockByKey(key).orElse(null);
        if (upload == null || !upload.getExpiresAt().isBefore(now)) return;

        if (media.existsByObjectKey(key)) {
            // Đẩy lùi để ảnh đã gắn vào post không chặn orphan phía sau trong batch.
            upload.setExpiresAt(now.plus(POST_LEASE));
            return;
        }

        minio.deleteFile(key); // Lỗi thì ném ra để retry; không dùng safeDelete ở đây.
        uploads.delete(upload);
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

    private void verifyStoredContentType(String key) {
        try {
            String contentType = minio.stat(key).contentType();
            if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
                throw new IllegalStateException("Unexpected image content type");
            }
        } catch (RuntimeException ex) {
            throw new MediaException(MediaErrorCode.MEDIA_NOT_FOUND,
                    MediaErrorCode.MEDIA_NOT_FOUND.getDefaultMessage(), ex);
        }
    }

    private TransactionTemplate newTx(int propagation) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(propagation);
        return template;
    }
}
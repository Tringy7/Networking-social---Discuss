package com.discuss.discuss.service.notification;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.notification.NotificationResponseDTO;
import com.discuss.discuss.entity.Notification;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.repository.NotificationRepository;
import com.discuss.discuss.service.media.MinioService;
import com.discuss.discuss.service.user.UserService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository repository;
    private final UserService userService;
    private final PageMapper pageMapper;
    private final MinioService minioService;

    @Transactional(readOnly = true)
    public PageResponseDTO<NotificationResponseDTO> getCurrentUserNotifications(boolean unreadOnly, Pageable pageable) {
        Long recipientId = userService.getCurrentUser().getId();
        Pageable newestFirst = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        var page = unreadOnly
                ? repository.findByRecipientIdAndReadAtIsNull(recipientId, newestFirst)
                : repository.findByRecipientId(recipientId, newestFirst);
        return pageMapper.toResponse(page.map(this::mapNotificationToResponse));
    }

    @Transactional(readOnly = true)
    public long countCurrentUserUnreadNotifications() {
        return repository.countByRecipientIdAndReadAtIsNull(userService.getCurrentUser().getId());
    }

    @Transactional
    public boolean markNotificationAsRead(Long id) {
        Long recipientId = userService.getCurrentUser().getId();
        return repository.markRead(id, recipientId, LocalDateTime.now()) > 0
                || repository.existsByIdAndRecipientId(id, recipientId);
    }

    @Transactional
    public void markAllNotificationsAsRead() {
        repository.markAllRead(userService.getCurrentUser().getId(), LocalDateTime.now());
    }

    @Transactional
    public void deleteCurrentUserReadNotifications() {
        repository.deleteReadNotifications(userService.getCurrentUser().getId());
    }

    private NotificationResponseDTO mapNotificationToResponse(Notification notification) {
        var actor = notification.getActor();
        var profile = actor.getProfile();
        String displayName = profile == null ? null : profile.getDisplayName();
        String avatar = profile == null ? null : profile.getAvatar();
        var actorResponse = new NotificationResponseDTO.Actor(actor.getUsername(),
                displayName == null || displayName.isBlank() ? actor.getUsername() : displayName,
                avatar == null ? null : minioService.buildFileUrl(avatar));
        return new NotificationResponseDTO(notification.getId(), notification.getType(), actorResponse,
                notification.getPostId(), notification.getCommentId(), notification.getReadAt() != null,
                notification.getCreatedAt(), notification.getCommunityName(), notification.getReportId(),
                notification.getReportTargetType(), notification.getReportStatus());
    }
}

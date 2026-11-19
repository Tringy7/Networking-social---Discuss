package com.discuss.discuss.service.notification;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.notification.NotificationResponseDTO;
import com.discuss.discuss.entity.Comment;
import com.discuss.discuss.entity.Notification;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.MembershipStatus;
import com.discuss.discuss.enums.NotificationType;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.repository.NotificationRepository;
import com.discuss.discuss.service.media.MinioService;
import com.discuss.discuss.service.user.UserService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository repository;
    private final CommunityMemberRepository communityMemberRepository;
    private final UserService userService;
    private final PageMapper pageMapper;
    private final MinioService minioService;

    @Transactional(readOnly = true)
    public PageResponseDTO<NotificationResponseDTO> list(boolean unreadOnly, Pageable pageable) {
        Long recipientId = userService.getCurrentUser().getId();
        Pageable newestFirst = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "createdAt", "id"));
        var page = unreadOnly
                ? repository.findByRecipientIdAndReadAtIsNull(recipientId, newestFirst)
                : repository.findByRecipientId(recipientId, newestFirst);
        return pageMapper.toResponse(page.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        return repository.countByRecipientIdAndReadAtIsNull(userService.getCurrentUser().getId());
    }

    @Transactional
    public boolean markRead(Long id) {
        Long recipientId = userService.getCurrentUser().getId();
        return repository.markRead(id, recipientId, LocalDateTime.now()) > 0
                || repository.existsByIdAndRecipientId(id, recipientId);
    }

    @Transactional
    public void markAllRead() {
        repository.markAllRead(userService.getCurrentUser().getId(), LocalDateTime.now());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void notifyPostCreated(Post post) {
        var author = post.getUser();
        var recipientIds = communityMemberRepository.findNotificationRecipientIds(
                post.getCommunity().getId(), MembershipStatus.ACTIVE, author.getId());
        repository.saveAll(recipientIds.stream()
                .map(recipientId -> createNotification(recipientId, author,
                        NotificationType.COMMUNITY_POST_CREATED, post.getId(), null))
                .toList());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void notifyCommentCreated(Comment comment) {
        var actor = comment.getUser();
        var post = comment.getPost();
        var parent = comment.getParentComment();
        Long postAuthorId = post.getUser().getId();
        Long parentAuthorId = parent == null ? null : parent.getUser().getId();

        if (parentAuthorId != null && !parentAuthorId.equals(actor.getId())) {
            repository.save(createNotification(parentAuthorId, actor,
                    NotificationType.COMMENT_REPLIED, post.getId(), comment.getId()));
        }
        if (!postAuthorId.equals(actor.getId()) && !postAuthorId.equals(parentAuthorId)) {
            repository.save(createNotification(postAuthorId, actor,
                    NotificationType.POST_COMMENTED, post.getId(), comment.getId()));
        }
    }

    private Notification createNotification(
            Long recipientId, User actor, NotificationType type, Long postId, Long commentId) {
        return Notification.builder()
                .recipientId(recipientId)
                .actor(actor)
                .type(type)
                .postId(postId)
                .commentId(commentId)
                .build();
    }

    private NotificationResponseDTO toResponse(Notification notification) {
        var actor = notification.getActor();
        var profile = actor.getProfile();
        String displayName = profile == null ? null : profile.getDisplayName();
        String avatar = profile == null ? null : profile.getAvatar();
        var actorResponse = new NotificationResponseDTO.Actor(actor.getUsername(),
                displayName == null || displayName.isBlank() ? actor.getUsername() : displayName,
                avatar == null ? null : minioService.buildFileUrl(avatar));
        return new NotificationResponseDTO(notification.getId(), notification.getType(), actorResponse,
                notification.getPostId(), notification.getCommentId(), notification.getReadAt() != null,
                notification.getCreatedAt());
    }
}

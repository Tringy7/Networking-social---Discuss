package com.discuss.discuss.service.post;

import com.discuss.discuss.dto.post.*;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.PostContent;
import com.discuss.discuss.entity.PostMedia;
import com.discuss.discuss.entity.PostSave;
import com.discuss.discuss.entity.PostVote;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.PostType;
import com.discuss.discuss.enums.VoteType;
import com.discuss.discuss.exception.post.PostErrorCode;
import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.mapper.post.PostMapper;
import com.discuss.discuss.repository.PostRepository;
import com.discuss.discuss.repository.PostSaveRepository;
import com.discuss.discuss.repository.PostVoteRepository;
import com.discuss.discuss.repository.PostContentRepository;
import com.discuss.discuss.service.community.CommunityAuthorizationService;
import com.discuss.discuss.service.community.CommunitySupport;
import com.discuss.discuss.service.notification.NotificationEvents;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Validated
public class PostService {

    private final PostRepository postRepository;
    private final PostSaveRepository postSaveRepository;
    private final PostVoteRepository postVoteRepository;
    private final PostContentRepository postContentRepository;
    private final PostAttachmentService postAttachmentService;

    private final UserService userService;
    private final CommunitySupport communitySupport;
    private final CommunityAuthorizationService communityAuthorizationService;
    private final PostSupport postSupport;
    private final NotificationEvents notificationEvents;

    private final PostMapper postMapper;

    // ==================== CREATE ====================
    @Transactional
    public PostResponseDTO createPost(@Valid CreatePostRequestDTO request, List<MultipartFile> files) {
        validateRequest(request);
        User user = userService.getCurrentUser();

        Community community = communitySupport.getCommunityByNameAndStatusActive(request.getCommunityName());
        communityAuthorizationService.requireMembership(community, user);

        postAttachmentService.validateMedia(request, files, Set.of());

        Post post = postRepository.saveAndFlush(Post.builder()
                .user(user)
                .community(community)
                .type(request.getType())
                .isPinned(false)
                .status(PostStatus.PUBLISHED)
                .build());

        postAttachmentService.storeNewImages(post, request, files);
        PostContent postContent = PostContent.builder().post(post).build();
        writeContent(postContent, request);
        postContentRepository.save(postContent);

        List<PostMedia> postAttachments = postAttachmentService.saveAttachments(post, request);
        notificationEvents.postCreated(post);
        return postMapper.toResponse(post, postContent, postAttachments, 0, 0, null, false);
    }

    // ==================== UPDATE ====================
    @Transactional
    public PostResponseDTO updatePost(Long id, @Valid CreatePostRequestDTO request, List<MultipartFile> files) {
        validateRequest(request);
        User user = userService.getCurrentUser();

        Post post = postSupport.findPublished(id);
        postSupport.requireAuthor(post, user);

        Community targetCommunity = communitySupport.getCommunityByNameAndStatusActive(request.getCommunityName());
        if (!Objects.equals(targetCommunity.getId(), post.getCommunity().getId())) {
            throw new PostException(PostErrorCode.COMMUNITY_CHANGE_NOT_ALLOWED);
        }
        communityAuthorizationService.requireMembership(targetCommunity, user);

        List<PostMedia> previousMedia = postAttachmentService.findAttachments(id);
        Set<String> ownedKeys = new HashSet<>();
        previousMedia.forEach(item -> ownedKeys.add(item.getObjectKey()));
        postAttachmentService.validateMedia(request, files, ownedKeys);
        postAttachmentService.storeNewImages(post, request, files);

        PostContent postContent = postSupport.findContent(post);
        post.setType(request.getType());
        post.setUpdatedAt(LocalDateTime.now());
        writeContent(postContent, request);

        List<PostMedia> postAttachments = postAttachmentService.replaceAttachments(post, request, previousMedia);

        return postSupport.toResponse(post, postContent, postAttachments, user);
    }

    // ==================== DELETE ====================
    @Transactional
    public void deletePost(Long id) {
        User user = userService.getCurrentUser();
        Post post = postSupport.findPublished(id);

        boolean isPostAuthor = Objects.equals(post.getUser().getId(), user.getId());
        if (!isPostAuthor && user.getRole() != UserRole.ADMIN) {
            communityAuthorizationService.requireModeratorOrOwner(post.getCommunity(), user);
        }

        softDelete(post, user);
    }

    @Transactional
    public PostResponseDTO restorePost(Long id) {
        User user = userService.getCurrentUser();
        Post post = postRepository.lockById(id)
                .filter(p -> p.getStatus() == PostStatus.DELETED)
                .filter(p -> postSupport.canRestore(p, user))
                .orElseThrow(postSupport::notFound);

        postSupport.requireRead(post, user);
        communityAuthorizationService.requireMembership(post.getCommunity(), user);

        post.setStatus(PostStatus.PUBLISHED);
        post.setDeletedAt(null);
        post.setDeletedByUserId(null);
        return postSupport.toResponse(post, user);
    }


    @HasRole("ADMIN")
    @Transactional
    public void deleteForAdmin(Long id) {
        User actor = userService.getCurrentUser();
        Post post = postRepository.lockById(id).orElseThrow(postSupport::notFound);
        if (post.getStatus() == PostStatus.DELETED) return;
        softDelete(post, actor);
    }

    /** Sets the current user's vote; null removes it. */
    @Transactional
    public PostResponseDTO vote(Long id, VoteType type) {
        User user = userService.getCurrentUser();
        Post post = postSupport.lockPublished(id);
        postSupport.requireRead(post, user);
        PostVote existingVote = postVoteRepository.findByPostIdAndUserId(id, user.getId()).orElse(null);

        if (type == null) {
            if (existingVote != null) postVoteRepository.delete(existingVote);
        } else if (existingVote == null) {
            postVoteRepository.save(PostVote.builder().post(post).user(user).voteType(type).build());
        } else {
            existingVote.setVoteType(type);
        }
        postVoteRepository.flush();
        return postSupport.toResponse(post, user);
    }

    @Transactional
    public PostResponseDTO savePost(Long id, boolean saved) {
        User user = userService.getCurrentUser();
        Post post = postSupport.lockPublished(id);
        postSupport.requireRead(post, user);
        var existing = postSaveRepository.findByPostIdAndUserId(id, user.getId());
        if (saved && existing.isEmpty()) {
            postSaveRepository.save(PostSave.builder().post(post).user(user).build());
        } else if (!saved) {
            existing.ifPresent(postSaveRepository::delete);
        }
        postSaveRepository.flush();
        return postSupport.toResponse(post, user);
    }

    private void validateRequest(CreatePostRequestDTO request) {
        if (request.getType() != PostType.TEXT) {
            throw new PostException(PostErrorCode.UNSUPPORTED_POST_TYPE);
        }
        boolean hasNoContent = request.getContent() == null || request.getContent().isBlank();
        boolean hasNoMedia = request.getMedia() == null || request.getMedia().isEmpty();
        if (hasNoContent && hasNoMedia) {
            throw new PostException(PostErrorCode.EMPTY_POST);
        }
    }

    private void writeContent(PostContent content, CreatePostRequestDTO request) {
        content.setTitle(request.getTitle().strip());
        content.setContent(request.getContent() == null ? "" : request.getContent());
    }

    private void softDelete(Post post, User actor) {
        post.setStatus(PostStatus.DELETED);
        post.setDeletedAt(LocalDateTime.now());
        post.setDeletedByUserId(actor.getId());
    }
}

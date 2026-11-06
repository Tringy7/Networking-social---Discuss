package com.discuss.discuss.service.post;

import com.discuss.discuss.dto.post.*;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.PostContent;
import com.discuss.discuss.entity.PostMedia;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.exception.post.PostErrorCode;
import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.mapper.post.PostMapper;
import com.discuss.discuss.repository.PostRepository;
import com.discuss.discuss.repository.PostSaveRepository;
import com.discuss.discuss.service.community.CommunityAuthorizationService;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.service.user.UserService;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.HashSet;

import org.springframework.web.multipart.MultipartFile;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

@Service
@RequiredArgsConstructor
@Validated
public class PostService {

    private final PostRepository postRepository;
    private final PostSaveRepository postSaveRepository;
    private final PostContentService postContentService;
    private final PostMediaService postMediaService;

    private final UserService userService;
    private final CommunityService communityService;
    private final CommunityAuthorizationService communityAuthorizationService;
    private final PostSupport postSupport;

    private final PostMapper postMapper;

    static boolean canRestoreDeletedPost(Post post, User user) {
        return Objects.equals(post.getUser().getId(), user.getId())
                && (post.getDeletedByUserId() == null
                || Objects.equals(post.getDeletedByUserId(), user.getId()));
    }

    // ==================== CREATE ====================
    @Transactional
    public PostResponseDTO createPost(@Valid CreatePostRequestDTO request) {
        return createPost(request, List.of());
    }

    @Transactional
    public PostResponseDTO createPost(@Valid CreatePostRequestDTO request, List<MultipartFile> files) {
        postContentService.validateRequest(request);
        User user = userService.getCurrentUser();

        Community community = communityService.getCommunityByNameAndStatusActive(request.getCommunityName());
        communityAuthorizationService.requireMembership(community, user);

        postMediaService.validateMedia(request, files, Set.of());

        Post post = postRepository.saveAndFlush(Post.builder()
                .user(user)
                .community(community)
                .type(request.getType())
                .isPinned(false)
                .status(PostStatus.PUBLISHED)
                .build());

        postMediaService.storeNewImages(post, request, files);
        PostContent postContent = postContentService.createContent(post, request);

        List<PostMedia> postAttachments =  postMediaService.saveAttachments(post, request);
        return postMapper.toResponse(post, postContent, postAttachments, 0, 0, null, false);
    }

    // ==================== READ ====================
    @Transactional(readOnly = true)
    public PostResponseDTO getPost(Long id) {
        User currentUser = userService.getCurrentUser();
        Post post = postSupport.findPublished(id);
        postSupport.requireRead(post, currentUser);
        return postSupport.toResponse(post, currentUser);
    }

    // ==================== UPDATE ====================
    @Transactional
    public PostResponseDTO updatePost(Long id, @Valid CreatePostRequestDTO request) {
        return updatePost(id, request, List.of());
    }

    @Transactional
    public PostResponseDTO updatePost(Long id, @Valid CreatePostRequestDTO request, List<MultipartFile> files) {
        postContentService.validateRequest(request);
        User user = userService.getCurrentUser();

        Post post = postSupport.findPublished(id);
        postSupport.requireAuthor(post, user);

        Community targetCommunity = communityService.getCommunityByNameAndStatusActive(request.getCommunityName());
        if (!Objects.equals(targetCommunity.getId(), post.getCommunity().getId())) {
            throw new PostException(PostErrorCode.COMMUNITY_CHANGE_NOT_ALLOWED);
        }
        communityAuthorizationService.requireMembership(targetCommunity, user);

        List<PostMedia> previousMedia = postMediaService.findAttachments(id);
        Set<String> ownedKeys = new HashSet<>();
        previousMedia.forEach(item -> ownedKeys.add(item.getObjectKey()));
        postMediaService.validateMedia(request, files, ownedKeys);
        postMediaService.storeNewImages(post, request, files);

        PostContent postContent = postSupport.findContent(post);
        post.setType(request.getType());
        post.setUpdatedAt(LocalDateTime.now());
        postContentService.writeContent(postContent, request);

        List<PostMedia> postAttachments = postMediaService.replaceAttachments(post, request, previousMedia);

        return postMapper.toResponse(post, postContent, postAttachments,
                postRepository.voteScore(id), postRepository.countComments(id),
                postSupport.userVote(id, user), postSaveRepository.existsByPostIdAndUserId(id, user.getId()));
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

        post.setStatus(PostStatus.DELETED);
        post.setDeletedAt(LocalDateTime.now());
        post.setDeletedByUserId(user.getId());
    }

    @Transactional
    public PostResponseDTO restorePost(Long id) {
        User user = userService.getCurrentUser();
        Post post = postRepository.lockById(id)
                .filter(p -> p.getStatus() == PostStatus.DELETED)
                .filter(p -> Objects.equals(p.getUser().getId(), user.getId()))
                .filter(p -> canRestoreDeletedPost(p, user))
                .orElseThrow(postSupport::notFound);

        postSupport.requireRead(post, user);
        communityAuthorizationService.requireMembership(post.getCommunity(), user);

        post.setStatus(PostStatus.PUBLISHED);
        post.setDeletedAt(null);
        post.setDeletedByUserId(null);
        return postSupport.toResponse(post, user);
    }

}
package com.discuss.discuss.service.post;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.post.*;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.PostContent;
import com.discuss.discuss.entity.PostMedia;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.MediaType;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.PostType;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.exception.post.PostErrorCode;
import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.mapper.post.PostMapper;
import com.discuss.discuss.repository.PostContentRepository;
import com.discuss.discuss.repository.PostMediaRepository;
import com.discuss.discuss.repository.PostRepository;
import com.discuss.discuss.repository.PostSaveRepository;
import com.discuss.discuss.service.community.CommunityAuthorizationService;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.service.media.ImageService;
import com.discuss.discuss.service.user.UserService;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

@Service
@RequiredArgsConstructor
@Validated
public class PostService {

    private final PostRepository postRepository;
    private final PostSaveRepository postSaveRepository;
    private final PostContentRepository postContentRepository;
    private final PostMediaRepository postMediaRepository;

    private final UserService userService;
    private final CommunityService communityService;
    private final CommunityAuthorizationService communityAuthorizationService;
    private final ImageService imageService;
    private final PostSupport postSupport;


    private final PostMapper postMapper;
    private final PageMapper pageMapper;

    // ==================== CREATE ====================
    @Transactional
    public PostResponseDTO createPost(@Valid CreatePostRequestDTO request) {
        validateRequest(request);
        User user = userService.getCurrentUser();

        Community community = communityService.getCommunityByNameAndStatusActive(request.getCommunityName());
        communityAuthorizationService.requireMembership(community, user);

        imageService.validateAndLockPostImages(extractImageKeys(request), user);

        Post post = postRepository.saveAndFlush(Post.builder()
                .user(user)
                .community(community)
                .type(request.getType())
                .isPinned(false)
                .status(PostStatus.PUBLISHED)
                .build());

        PostContent postContent = PostContent.builder().post(post).build();
        writeContent(postContent, request);
        postContentRepository.save(postContent);

        List<PostMedia> postAttachments =  this.saveAttachments(post, request);
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
        validateRequest(request);
        User user = userService.getCurrentUser();

        Post post = postRepository.lockById(id)
                .filter(p -> p.getStatus() == PostStatus.PUBLISHED)
                .orElseThrow(postSupport::notFound);
        postSupport.requireAuthor(post, user);

        Community targetCommunity = communityService.getCommunityByNameAndStatusActive(request.getCommunityName());
        if (!Objects.equals(targetCommunity.getId(), post.getCommunity().getId())) {
            throw new PostException(PostErrorCode.COMMUNITY_CHANGE_NOT_ALLOWED);
        }
        communityAuthorizationService.requireMembership(targetCommunity, user);

        PostContent postContent = postSupport.findContent(post);
        post.setType(request.getType());
        post.setUpdatedAt(LocalDateTime.now());
        writeContent(postContent, request);

        List<PostMedia> postAttachments = replaceAttachments(post, request, user);

        return postMapper.toResponse(post, postContent, postAttachments,
                postRepository.voteScore(id), postRepository.countComments(id),
                postSupport.userVote(id, user), postSaveRepository.existsByPostIdAndUserId(id, user.getId()));
    }

    /**
     * Replace all pics
     */
    private List<PostMedia> replaceAttachments(Post post, CreatePostRequestDTO request, User user) {
        Long postId = post.getId();
        List<String> newImageKeys = extractImageKeys(request);

        Set<String> imageKeysToLock = new TreeSet<>(newImageKeys);
        postMediaRepository.findByPostIdOrderByDisplayOrderAsc(postId).stream()
                .map(PostMedia::getObjectKey)
                .filter(Objects::nonNull)
                .forEach(imageKeysToLock::add);

        imageService.releasePostImages(imageKeysToLock);
        imageService.validateAndLockPostImages(newImageKeys, user);

        postMediaRepository.deleteByPostId(postId);
        postMediaRepository.flush();
        return saveAttachments(post, request);
    }

    // ==================== DELETE ====================
    @Transactional
    public void deletePost(Long id) {
        User user = userService.getCurrentUser();
        Post post = postRepository.lockById(id)
                .filter(p -> p.getStatus() != PostStatus.DELETED)
                .orElseThrow(postSupport::notFound);

        boolean isPostAuthor = Objects.equals(post.getUser().getId(), user.getId());
        if (!isPostAuthor && user.getRole() != UserRole.ADMIN) {
            communityAuthorizationService.requireModeratorOrOwner(post.getCommunity(), user);
        }

        post.setStatus(PostStatus.DELETED);
        post.setDeletedAt(LocalDateTime.now());
        post.setDeletedByUserId(user.getId());
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<TrashedPostResponseDTO> listTrash(int page, int size) {
        User user = userService.getCurrentUser();
        Specification<Post> ownedDeleted = (root, query, cb) -> cb.and(
                cb.equal(root.get("user").get("id"), user.getId()),
                cb.equal(root.get("status"), PostStatus.DELETED));
        var result = postRepository.findAll(ownedDeleted, PageRequest.of(page, size,
                org.springframework.data.domain.Sort.by("deletedAt").descending().and(
                        org.springframework.data.domain.Sort.by("id").descending())));
        return pageMapper.toResponse(result.map(post -> new TrashedPostResponseDTO(
                postSupport.toResponse(post, user), post.getDeletedAt(),
                canRestoreDeletedPost(post, user))));
    }

    static boolean canRestoreDeletedPost(Post post, User user) {
        // Legacy deletions predate actor tracking; known moderation deletions remain blocked.
        return Objects.equals(post.getUser().getId(), user.getId())
                && (post.getDeletedByUserId() == null
                    || Objects.equals(post.getDeletedByUserId(), user.getId()));
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

    // ==================== REQUEST HANDLING ====================
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

    private List<String> extractImageKeys(CreatePostRequestDTO request) {
        Set<String> imageKeys = new LinkedHashSet<>();
        for (PostMediaDTO mediaItem : mediaOf(request)) {
            if (mediaItem.getType() != MediaType.IMAGE) {
                throw new PostException(PostErrorCode.UNSUPPORTED_MEDIA_TYPE);
            }
            if (!imageKeys.add(mediaItem.getObjectKey())) {
                throw new PostException(PostErrorCode.DUPLICATE_MEDIA);
            }
        }
        if (!imageKeys.containsAll(PostMarkdown.imageKeys(request.getContent()))) {
            throw new PostException(PostErrorCode.MARKDOWN_MEDIA_MISSING);
        }
        return List.copyOf(imageKeys);
    }

    private List<PostMediaDTO> mediaOf(CreatePostRequestDTO request) {
        return request.getMedia() == null ? List.of() : request.getMedia();
    }

    private List<PostMedia> saveAttachments(Post post, CreatePostRequestDTO request) {
        List<PostMediaDTO> requestedMedia = mediaOf(request);

        List<PostMedia> postAttachments = new ArrayList<>(requestedMedia.size());
        for (int i = 0; i < requestedMedia.size(); i++) {
            PostMediaDTO mediaItem = requestedMedia.get(i);
            if (postMediaRepository.existsByObjectKey(mediaItem.getObjectKey())) {
                throw new PostException(PostErrorCode.DUPLICATE_MEDIA);
            }
            postAttachments.add(PostMedia.builder()
                    .post(post)
                    .objectKey(mediaItem.getObjectKey())
                    .type(mediaItem.getType())
                    .caption(mediaItem.getCaption())
                    .displayOrder(i)
                    .build());
        }
        return postMediaRepository.saveAll(postAttachments);
    }

    private void writeContent(PostContent postContent, CreatePostRequestDTO request) {
        postContent.setTitle(request.getTitle().strip());
        postContent.setContent(request.getContent() == null ? "" : request.getContent());

    }
}
package com.discuss.discuss.service.post;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.post.*;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.PostContent;
import com.discuss.discuss.entity.PostMedia;
import com.discuss.discuss.entity.PostVote;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.MediaType;
import com.discuss.discuss.enums.MembershipStatus;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.PostType;
import com.discuss.discuss.enums.UserRole;
import com.discuss.discuss.enums.VoteType;
import com.discuss.discuss.exception.post.PostErrorCode;
import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.mapper.post.PostMapper;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.repository.PostContentRepository;
import com.discuss.discuss.repository.PostMediaRepository;
import com.discuss.discuss.repository.PostRepository;
import com.discuss.discuss.repository.PostVoteRepository;
import com.discuss.discuss.service.community.CommunityAuthorizationService;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.service.media.ImageService;
import com.discuss.discuss.service.user.UserService;
import jakarta.persistence.criteria.Order;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;

@Service
@RequiredArgsConstructor
@Validated
public class PostService {

    private final PostRepository postRepository;
    private final PostVoteRepository postVoteRepository;
    private final PostContentRepository postContentRepository;
    private final PostMediaRepository postMediaRepository;
    private final CommunityMemberRepository communityMemberRepository;

    private final UserService userService;
    private final CommunityService communityService;
    private final CommunityAuthorizationService communityAuthorizationService;
    private final ImageService imageService;

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
        this.writeContent(postContent, request);
        postContentRepository.save(postContent);

        List<PostMedia> postAttachments =  this.saveAttachments(post, request);
        return postMapper.toResponse(post, postContent, postAttachments, 0, 0, null);
    }

    /** Sets the current user's vote; null removes it. The post lock serializes concurrent writes. */
    @Transactional
    public PostResponseDTO vote(Long id, VoteType type) {
        User user = userService.getCurrentUser();

        Post post = postRepository.lockById(id)
                .filter(p -> p.getStatus() == PostStatus.PUBLISHED)
                .orElseThrow(this::notFound);

        requireRead(post, user);
        PostVote existingVote = postVoteRepository.findByPostIdAndUserId(id, user.getId()).orElse(null);

        if (type == null) {
            if (existingVote != null) postVoteRepository.delete(existingVote);
        } else if (existingVote == null) {
            postVoteRepository.save(PostVote.builder().post(post).user(user).voteType(type).build());
        } else {
            existingVote.setVoteType(type);
        }
        postVoteRepository.flush();
        return toResponse(post, user);
    }

    private VoteType userVote(Long id, User user) {
        return postVoteRepository.findByPostIdAndUserId(id, user.getId()).map(PostVote::getVoteType).orElse(null);
    }

    // ==================== READ ====================
    @Transactional(readOnly = true)
    public PostResponseDTO getPost(Long id) {
        User currentUser = userService.getCurrentUser();
        Post post = findPublished(id);
        requireRead(post, currentUser);
        return toResponse(post, currentUser);
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<PostResponseDTO> list(String communityName, String username, String tab,
                                                 int page, int size, String searchKeyword) {
        User currentUser = userService.getCurrentUser();
        Community community = resolveListCommunity(communityName, currentUser);
        if (username != null) userService.getUserActive(username);

        Specification<Post> postSpecification = visibleTo(currentUser);
        if (community != null) postSpecification = postSpecification.and(inCommunity(community));
        if (username != null) postSpecification = postSpecification.and(writtenBy(username));
        if (searchKeyword != null && !searchKeyword.isBlank()) postSpecification = postSpecification.and(matchesText(searchKeyword));
        postSpecification = postSpecification.and(ordered(community != null, "popular".equals(tab)));

        return pageMapper.toResponse(
                postRepository.findAll(postSpecification, PageRequest.of(page, size)).map(p -> toResponse(p, currentUser)));
    }

    // ==================== UPDATE ====================
    @Transactional
    public PostResponseDTO updatePost(Long id, @Valid CreatePostRequestDTO request) {
        validateRequest(request);
        User user = userService.getCurrentUser();

        Post post = postRepository.lockById(id)
                .filter(p -> p.getStatus() == PostStatus.PUBLISHED)
                .orElseThrow(this::notFound);
        requireAuthor(post, user);

        Community targetCommunity = communityService.getCommunityByNameAndStatusActive(request.getCommunityName());
        if (!Objects.equals(targetCommunity.getId(), post.getCommunity().getId())) {
            throw new PostException(PostErrorCode.COMMUNITY_CHANGE_NOT_ALLOWED);
        }
        communityAuthorizationService.requireMembership(targetCommunity, user);

        PostContent postContent = findContent(post);
        post.setType(request.getType());
        post.setUpdatedAt(LocalDateTime.now());
        writeContent(postContent, request);

        List<PostMedia> postAttachments = replaceAttachments(post, request, user);

        return postMapper.toResponse(post, postContent, postAttachments,
                postRepository.voteScore(id), postRepository.countComments(id),
                userVote(id, user));
    }

    /**
     * Thay toàn bộ danh sách ảnh của post.
     * Chỉ xóa dòng PostMedia; file MinIO sẽ được cleanup dọn sau khi không còn tham chiếu.
     */
    private List<PostMedia> replaceAttachments(Post post, CreatePostRequestDTO request, User user) {
        Long postId = post.getId();
        List<String> newImageKeys = extractImageKeys(request);

        // Gom key cũ + mới, lock theo thứ tự cố định rồi mới validate (tránh deadlock).
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
                .orElseThrow(this::notFound);

        boolean isPostAuthor = Objects.equals(post.getUser().getId(), user.getId());
        if (!isPostAuthor && user.getRole() != UserRole.ADMIN) {
            communityAuthorizationService.requireModeratorOrOwner(post.getCommunity(), user);
        }

        imageService.releasePostImages(
                postMediaRepository.findByPostIdOrderByDisplayOrderAsc(id).stream()
                        .map(PostMedia::getObjectKey)
                        .filter(Objects::nonNull)
                        .toList());

        post.setStatus(PostStatus.DELETED);
        post.setDeletedAt(LocalDateTime.now());
        postMediaRepository.deleteByPostId(id);
    }

    // ==================== LIST: SPECIFICATIONS ====================
    private Community resolveListCommunity(String communityName, User currentUser) {
        if (communityName == null) return null;
        Community community = communityService.getCommunityByNameAndStatusActive(communityName);
        if (community.getVisibility() == CommunityVisibility.PRIVATE) {
            communityAuthorizationService.requireMembership(community, currentUser);
        }
        return community;
    }

    /** Post đã đăng, community còn hoạt động, và (community public hoặc currentUser là memberRoot active). */
    private Specification<Post> visibleTo(User currentUser) {
        return (postRoot, criteriaQuery, criteriaBuilder) -> {
            var membershipQuery = criteriaQuery.subquery(Long.class);
            var memberRoot = membershipQuery.from(CommunityMember.class);
            membershipQuery.select(memberRoot.get("id")).where(
                    criteriaBuilder.equal(memberRoot.get("community"), postRoot.get("community")),
                    criteriaBuilder.equal(memberRoot.get("user").get("id"), currentUser.getId()),
                    criteriaBuilder.equal(memberRoot.get("status"), MembershipStatus.ACTIVE));

            return criteriaBuilder.and(
                    criteriaBuilder.equal(postRoot.get("status"), PostStatus.PUBLISHED),
                    criteriaBuilder.equal(postRoot.get("community").get("status"), CommunityStatus.ACTIVE),
                    criteriaBuilder.or(criteriaBuilder.equal(postRoot.get("community").get("visibility"), CommunityVisibility.PUBLIC),
                            criteriaBuilder.exists(membershipQuery)));
        };
    }

    private Specification<Post> inCommunity(Community community) {
        return (postRoot, criteriaQuery, criteriaBuilder) -> criteriaBuilder.equal(postRoot.get("community"), community);
    }

    private Specification<Post> writtenBy(String username) {
        return (postRoot, criteriaQuery, criteriaBuilder) -> criteriaBuilder.equal(postRoot.get("user").get("username"), username);
    }

    /** Tìm trong title và nội dung Markdown. */
    private Specification<Post> matchesText(String searchKeyword) {
        String searchPattern = likePattern(searchKeyword);
        return (postRoot, criteriaQuery, criteriaBuilder) -> {
            var contentQuery = criteriaQuery.subquery(Long.class);
            var contentRoot = contentQuery.from(PostContent.class);

            contentQuery.select(contentRoot.get("id")).where(
                    criteriaBuilder.equal(contentRoot.get("post"), postRoot),
                    criteriaBuilder.or(criteriaBuilder.like(criteriaBuilder.lower(contentRoot.get("title")), searchPattern, '!'),
                            criteriaBuilder.like(criteriaBuilder.lower(contentRoot.get("content")), searchPattern, '!')));
            return criteriaBuilder.exists(contentQuery);
        };
    }

    /** Chỉ áp dụng ORDER BY cho criteriaQuery lấy dữ liệu, bỏ qua criteriaQuery count. */
    private Specification<Post> ordered(boolean sortPinnedFirst, boolean sortByPopularity) {
        return (postRoot, criteriaQuery, criteriaBuilder) -> {
            if (criteriaQuery.getResultType() == Long.class) return null;

            List<Order> sortOrders = new ArrayList<>();
            if (sortPinnedFirst) sortOrders.add(criteriaBuilder.desc(postRoot.get("isPinned")));
            if (sortByPopularity) {
                var voteScoreQuery = criteriaQuery.subquery(Long.class);
                var voteRoot = voteScoreQuery.from(PostVote.class);
                voteScoreQuery.select(criteriaBuilder.coalesce(criteriaBuilder.sum(criteriaBuilder.<Long>selectCase()
                        .when(criteriaBuilder.equal(voteRoot.get("voteType"), VoteType.UP), 1L)
                        .otherwise(-1L)), 0L)).where(criteriaBuilder.equal(voteRoot.get("post"), postRoot));
                sortOrders.add(criteriaBuilder.desc(voteScoreQuery));
            }
            sortOrders.add(criteriaBuilder.desc(postRoot.get("createdAt")));
            sortOrders.add(criteriaBuilder.desc(postRoot.get("id")));
            criteriaQuery.orderBy(sortOrders);
            return null;
        };
    }

    /** Escape ký tự đặc biệt của LIKE (dùng '!' làm escape char). */
    private String likePattern(String searchKeyword) {
        String escapedKeyword = searchKeyword.toLowerCase(Locale.ROOT)
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
        return "%" + escapedKeyword + "%";
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

    /** Lấy danh sách key ảnh (giữ thứ tự), chặn sai loại, trùng, và ảnh trong markdown mà không đính kèm. */
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
        postContent.setTags(request.getTags() == null
                ? new ArrayList<>()
                : new ArrayList<>(request.getTags().stream().map(String::strip).distinct().toList()));

    }

    // ==================== HELPERS ====================
    private PostResponseDTO toResponse(Post post, User currentUser) {
        Long id = post.getId();
        return postMapper.toResponse(post, findContent(post),
                postMediaRepository.findByPostIdOrderByDisplayOrderAsc(id),
                postRepository.voteScore(id), postRepository.countComments(id),
                userVote(id, currentUser));
    }

    private PostContent findContent(Post post) {
        return postContentRepository.findByPostId(post.getId()).orElseThrow(this::notFound);
    }

    private Post findPublished(Long id) {
        return postRepository.findById(id)
                .filter(p -> p.getStatus() == PostStatus.PUBLISHED)
                .orElseThrow(this::notFound);
    }

    private void requireRead(Post post, User user) {
        Community community = post.getCommunity();
        if (community.getStatus() != CommunityStatus.ACTIVE) throw notFound();

        boolean isPrivateCommunity = community.getVisibility() == CommunityVisibility.PRIVATE;
        if (isPrivateCommunity && communityMemberRepository.findByCommunityAndUserAndStatus(
                community, user, MembershipStatus.ACTIVE).isEmpty()) {
            throw notFound(); // Ẩn sự tồn tại của post trong community private.
        }
    }

    private void requireAuthor(Post post, User user) {
        if (!Objects.equals(post.getUser().getId(), user.getId())) {
            throw new PostException(PostErrorCode.POST_EDIT_FORBIDDEN);
        }
    }

    private PostException notFound() {
        return new PostException(PostErrorCode.POST_NOT_FOUND);
    }
}
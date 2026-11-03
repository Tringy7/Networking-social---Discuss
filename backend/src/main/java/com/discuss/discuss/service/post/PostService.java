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
import com.discuss.discuss.service.community.CommunityAuthorizationService;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.service.media.ImageService;
import com.discuss.discuss.service.user.UserService;
import jakarta.persistence.criteria.JoinType;
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

    private final PostRepository posts;
    private final PostContentRepository contents;
    private final PostMediaRepository media;
    private final CommunityMemberRepository members;

    private final UserService userService;
    private final CommunityService communityService;
    private final CommunityAuthorizationService authorization;
    private final ImageService imageService;

    private final PostMapper mapper;
    private final PageMapper pages;

    // ==================== CREATE ====================
    @Transactional
    public PostResponseDTO createPost(@Valid CreatePostRequestDTO request) {
        validateRequest(request);
        User user = userService.getCurrentUser();

        Community community = communityService.getCommunityByNameAndStatusActive(request.getCommunityName());
        authorization.requireMembership(community, user);

        imageService.validateAndLockPostImages(extractImageKeys(request), user);

        Post post = posts.saveAndFlush(Post.builder()
                .user(user)
                .community(community)
                .type(request.getType())
                .isPinned(false)
                .status(PostStatus.PUBLISHED)
                .build());

        PostContent content = PostContent.builder().post(post).build();
        writeContent(content, request);
        contents.save(content);

        List<PostMedia> attachments = saveAttachments(post, request);
        return mapper.toResponse(post, content, attachments, 0, 0, false);
    }

    // ==================== READ ====================
    @Transactional(readOnly = true)
    public PostResponseDTO getPost(Long id) {
        User viewer = userService.getCurrentUser();
        Post post = findPublished(id);
        requireRead(post, viewer);
        return toResponse(post, viewer);
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<PostResponseDTO> list(String communityName, String username, String tab,
                                                 int page, int size, String q) {
        User viewer = userService.getCurrentUser();
        Community community = resolveListCommunity(communityName, viewer);
        if (username != null) userService.getUserActive(username);

        Specification<Post> spec = visibleTo(viewer);
        if (community != null) spec = spec.and(inCommunity(community));
        if (username != null) spec = spec.and(writtenBy(username));
        if (q != null && !q.isBlank()) spec = spec.and(matchesText(q));
        spec = spec.and(ordered(community != null, "popular".equals(tab)));

        return pages.toResponse(
                posts.findAll(spec, PageRequest.of(page, size)).map(p -> toResponse(p, viewer)));
    }

    // ==================== UPDATE ====================
    @Transactional
    public PostResponseDTO updatePost(Long id, @Valid CreatePostRequestDTO request) {
        validateRequest(request);
        User user = userService.getCurrentUser();

        Post post = posts.lockById(id)
                .filter(p -> p.getStatus() == PostStatus.PUBLISHED)
                .orElseThrow(this::notFound);
        requireAuthor(post, user);

        Community target = communityService.getCommunityByNameAndStatusActive(request.getCommunityName());
        if (!Objects.equals(target.getId(), post.getCommunity().getId())) {
            throw new PostException(PostErrorCode.COMMUNITY_CHANGE_NOT_ALLOWED);
        }
        authorization.requireMembership(target, user);

        PostContent content = findContent(post);
        post.setType(request.getType());
        post.setUpdatedAt(LocalDateTime.now());
        writeContent(content, request);

        List<PostMedia> attachments = replaceAttachments(post, request, user);

        return mapper.toResponse(post, content, attachments,
                posts.countHearts(id), posts.countComments(id),
                posts.countUserHeart(id, user.getId()) > 0);
    }

    /**
     * Thay toàn bộ danh sách ảnh của post.
     * Chỉ xóa dòng PostMedia; file MinIO sẽ được cleanup dọn sau khi không còn tham chiếu.
     */
    private List<PostMedia> replaceAttachments(Post post, CreatePostRequestDTO request, User user) {
        Long postId = post.getId();
        List<String> newKeys = extractImageKeys(request);

        // Gom key cũ + mới, lock theo thứ tự cố định rồi mới validate (tránh deadlock).
        Set<String> allKeys = new TreeSet<>(newKeys);
        media.findByPostIdOrderByDisplayOrderAsc(postId).stream()
                .map(PostMedia::getObjectKey)
                .filter(Objects::nonNull)
                .forEach(allKeys::add);

        imageService.releasePostImages(allKeys);
        imageService.validateAndLockPostImages(newKeys, user);

        media.deleteByPostId(postId);
        media.flush();
        return saveAttachments(post, request);
    }

    // ==================== DELETE ====================
    @Transactional
    public void deletePost(Long id) {
        User user = userService.getCurrentUser();
        Post post = posts.lockById(id)
                .filter(p -> p.getStatus() != PostStatus.DELETED)
                .orElseThrow(this::notFound);

        boolean isAuthor = Objects.equals(post.getUser().getId(), user.getId());
        if (!isAuthor && user.getRole() != UserRole.ADMIN) {
            authorization.requireModeratorOrOwner(post.getCommunity(), user);
        }

        imageService.releasePostImages(
                media.findByPostIdOrderByDisplayOrderAsc(id).stream()
                        .map(PostMedia::getObjectKey)
                        .filter(Objects::nonNull)
                        .toList());

        post.setStatus(PostStatus.DELETED);
        post.setDeletedAt(LocalDateTime.now());
        media.deleteByPostId(id);
    }

    // ==================== LIST: SPECIFICATIONS ====================
    private Community resolveListCommunity(String communityName, User viewer) {
        if (communityName == null) return null;
        Community community = communityService.getCommunityByNameAndStatusActive(communityName);
        if (community.getVisibility() == CommunityVisibility.PRIVATE) {
            authorization.requireMembership(community, viewer);
        }
        return community;
    }

    /** Post đã đăng, community còn hoạt động, và (community public hoặc viewer là member active). */
    private Specification<Post> visibleTo(User viewer) {
        return (root, query, cb) -> {
            var membership = query.subquery(Long.class);
            var member = membership.from(CommunityMember.class);
            membership.select(member.get("id")).where(
                    cb.equal(member.get("community"), root.get("community")),
                    cb.equal(member.get("user").get("id"), viewer.getId()),
                    cb.equal(member.get("status"), MembershipStatus.ACTIVE));

            return cb.and(
                    cb.equal(root.get("status"), PostStatus.PUBLISHED),
                    cb.equal(root.get("community").get("status"), CommunityStatus.ACTIVE),
                    cb.or(cb.equal(root.get("community").get("visibility"), CommunityVisibility.PUBLIC),
                            cb.exists(membership)));
        };
    }

    private Specification<Post> inCommunity(Community community) {
        return (root, query, cb) -> cb.equal(root.get("community"), community);
    }

    private Specification<Post> writtenBy(String username) {
        return (root, query, cb) -> cb.equal(root.get("user").get("username"), username);
    }

    /** Tìm trong title, content và các block cũ (legacy). */
    private Specification<Post> matchesText(String q) {
        String term = likePattern(q);
        return (root, query, cb) -> {
            var search = query.subquery(Long.class);
            var text = search.from(PostContent.class);
            var block = text.join("blocks", JoinType.LEFT);

            search.select(text.get("id")).where(
                    cb.equal(text.get("post"), root),
                    cb.or(cb.like(cb.lower(text.get("title")), term, '!'),
                            cb.like(cb.lower(text.get("content")), term, '!'),
                            cb.like(cb.lower(block.get("text")), term, '!'),
                            cb.like(cb.lower(block.get("code")), term, '!'),
                            cb.like(cb.lower(block.get("url")), term, '!')));
            return cb.exists(search);
        };
    }

    /** Chỉ áp dụng ORDER BY cho query lấy dữ liệu, bỏ qua query count. */
    private Specification<Post> ordered(boolean pinnedFirst, boolean byPopularity) {
        return (root, query, cb) -> {
            if (query.getResultType() == Long.class) return null;

            List<Order> order = new ArrayList<>();
            if (pinnedFirst) order.add(cb.desc(root.get("isPinned")));
            if (byPopularity) {
                var hearts = query.subquery(Long.class);
                var vote = hearts.from(PostVote.class);
                hearts.select(cb.count(vote)).where(
                        cb.equal(vote.get("post"), root),
                        cb.equal(vote.get("voteType"), VoteType.UP));
                order.add(cb.desc(hearts));
            }
            order.add(cb.desc(root.get("createdAt")));
            order.add(cb.desc(root.get("id")));
            query.orderBy(order);
            return null;
        };
    }

    /** Escape ký tự đặc biệt của LIKE (dùng '!' làm escape char). */
    private String likePattern(String q) {
        String escaped = q.toLowerCase(Locale.ROOT)
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
        return "%" + escaped + "%";
    }

    // ==================== REQUEST HANDLING ====================
    private void validateRequest(CreatePostRequestDTO request) {
        if (request.getType() != PostType.TEXT) {
            throw new PostException(PostErrorCode.UNSUPPORTED_POST_TYPE);
        }
        boolean noContent = request.getContent() == null || request.getContent().isBlank();
        boolean noMedia = request.getMedia() == null || request.getMedia().isEmpty();
        if (noContent && noMedia) {
            throw new PostException(PostErrorCode.EMPTY_POST);
        }
    }

    /** Lấy danh sách key ảnh (giữ thứ tự), chặn sai loại, trùng, và ảnh trong markdown mà không đính kèm. */
    private List<String> extractImageKeys(CreatePostRequestDTO request) {
        Set<String> keys = new LinkedHashSet<>();
        for (PostMediaDTO item : mediaOf(request)) {
            if (item.getType() != MediaType.IMAGE) {
                throw new PostException(PostErrorCode.UNSUPPORTED_MEDIA_TYPE);
            }
            if (!keys.add(item.getObjectKey())) {
                throw new PostException(PostErrorCode.DUPLICATE_MEDIA);
            }
        }
        if (!keys.containsAll(PostMarkdown.imageKeys(request.getContent()))) {
            throw new PostException(PostErrorCode.MARKDOWN_MEDIA_MISSING);
        }
        return List.copyOf(keys);
    }

    private List<PostMediaDTO> mediaOf(CreatePostRequestDTO request) {
        return request.getMedia() == null ? List.of() : request.getMedia();
    }

    private List<PostMedia> saveAttachments(Post post, CreatePostRequestDTO request) {
        Set<String> inlineKeys = PostMarkdown.imageKeys(request.getContent());
        List<PostMediaDTO> requested = mediaOf(request);

        List<PostMedia> attachments = new ArrayList<>(requested.size());
        for (int i = 0; i < requested.size(); i++) {
            PostMediaDTO item = requested.get(i);
            attachments.add(PostMedia.builder()
                    .post(post)
                    .objectKey(item.getObjectKey())
                    .mediaType(item.getType())
                    .caption(item.getCaption())
                    .displayOrder(i)
                    .inlineImage(inlineKeys.contains(item.getObjectKey()))
                    .build());
        }
        return media.saveAll(attachments);
    }

    private void writeContent(PostContent content, CreatePostRequestDTO request) {
        content.setTitle(request.getTitle().strip());
        content.setContent(request.getContent() == null ? "" : request.getContent());
        content.setTags(request.getTags() == null
                ? new ArrayList<>()
                : new ArrayList<>(request.getTags().stream().map(String::strip).distinct().toList()));
        content.setLinkUrl(null);
        content.setCode(null);
        content.setCodeLanguage(null);
        content.setBlocks(new ArrayList<>()); // Bỏ block legacy khi đã có request thay thế đầy đủ.
    }

    // ==================== HELPERS ====================
    private PostResponseDTO toResponse(Post post, User viewer) {
        Long id = post.getId();
        return mapper.toResponse(post, findContent(post),
                media.findByPostIdOrderByDisplayOrderAsc(id),
                posts.countHearts(id), posts.countComments(id),
                posts.countUserHeart(id, viewer.getId()) > 0);
    }

    private PostContent findContent(Post post) {
        return contents.findByPostId(post.getId()).orElseThrow(this::notFound);
    }

    private Post findPublished(Long id) {
        return posts.findById(id)
                .filter(p -> p.getStatus() == PostStatus.PUBLISHED)
                .orElseThrow(this::notFound);
    }

    private void requireRead(Post post, User user) {
        Community community = post.getCommunity();
        if (community.getStatus() != CommunityStatus.ACTIVE) throw notFound();

        boolean isPrivate = community.getVisibility() == CommunityVisibility.PRIVATE;
        if (isPrivate && members.findByCommunityAndUserAndStatus(
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
package com.discuss.discuss.service.post;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.post.PostResponseDTO;
import com.discuss.discuss.dto.post.TrashedPostResponseDTO;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.repository.PostRepository;
import com.discuss.discuss.service.community.CommunityAuthorizationService;
import com.discuss.discuss.service.community.CommunitySupport;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostQueryService {

    private final PostRepository postRepository;
    private final UserService userService;
    private final CommunitySupport communitySupport;
    private final CommunityAuthorizationService communityAuthorizationService;
    private final PostSupport postSupport;
    private final PageMapper pageMapper;
    private final PostSpecifications postSpecifications;

    @Transactional(readOnly = true)
    public PageResponseDTO<PostResponseDTO> list(String communityName, String username, String tab,
                                                 int page, int size, String searchKeyword) {
        User currentUser = userService.getCurrentUser();
        Community community = resolveListCommunity(communityName, currentUser);
        if (username != null) userService.getActiveByUsername(username);

        Specification<Post> specification = postSpecifications.buildFeedSpecification(
                currentUser, community, username, tab, searchKeyword);

        return findPostResponses(specification, PageRequest.of(page, size), currentUser);
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<PostResponseDTO> listSaved(int page, int size) {
        User user = userService.getCurrentUser();
        Specification<Post> specification = postSpecifications.buildSavedSpecification(user);
        return findPostResponses(specification, PageRequest.of(page, size), user);
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<TrashedPostResponseDTO> listTrash(int page, int size) {
        User user = userService.getCurrentUser();

        var pageable = PageRequest.of(page, size,
                Sort.by("deletedAt").descending()
                        .and(Sort.by("id").descending()));

        Specification<Post> specification = postSpecifications.buildTrashSpecification(user);
        var result = postRepository.findAll(specification, pageable);

        return pageMapper.toResponse(result.map(post -> new TrashedPostResponseDTO(
                postSupport.toResponse(post, user),
                post.getDeletedAt(),
                postSupport.canRestore(post, user))));
    }

    @Transactional(readOnly = true)
    public PostResponseDTO getPost(Long id) {
        User user = userService.getCurrentUser();
        Post post = postSupport.findPublished(id);
        postSupport.requireRead(post, user);
        return postSupport.toResponse(post, user);
    }

    @HasRole("ADMIN")
    @Transactional(readOnly = true)
    public long countAll() {
        return postRepository.count();
    }

    @HasRole("ADMIN")
    @Transactional(readOnly = true)
    public PageResponseDTO<PostResponseDTO> listForAdmin(Pageable pageable,
            PostStatus status, String communityName, String search) {
        User actor = userService.getCurrentUser();
        Specification<Post> specification = postSpecifications.buildManagementSpecification(
                status, communitySupport.normalize(communityName), search);
        return findPostResponses(specification, pageable, actor);
    }

    @HasRole("ADMIN")
    @Transactional(readOnly = true)
    public PostResponseDTO getForAdmin(Long id) {
        Post post = postRepository.findById(id).orElseThrow(postSupport::notFound);
        return postSupport.toResponse(post, userService.getCurrentUser());
    }

    private PageResponseDTO<PostResponseDTO> findPostResponses(
            Specification<Post> specification, Pageable pageable, User currentUser) {
        return pageMapper.toResponse(postRepository.findAll(specification, pageable)
                .map(post -> postSupport.toResponse(post, currentUser)));
    }

    private Community resolveListCommunity(String communityName, User currentUser) {
        if (communityName == null) return null;
        Community community = communitySupport.getCommunityByNameAndStatusActive(communityName);
        if (community.getVisibility() == CommunityVisibility.PRIVATE) {
            communityAuthorizationService.requireMembership(community, currentUser);
        }
        return community;
    }
}

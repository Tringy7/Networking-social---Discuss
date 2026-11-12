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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.discuss.discuss.service.post.PostSpecifications.*;

@Service
@RequiredArgsConstructor
public class PostQueryService {

    private final PostRepository postRepository;
    private final UserService userService;
    private final CommunitySupport communitySupport;
    private final CommunityAuthorizationService communityAuthorizationService;
    private final PostSupport postSupport;
    private final PageMapper pageMapper;

    // ==================== LIST: SPECIFICATIONS ====================
    @Transactional(readOnly = true)
    public PageResponseDTO<PostResponseDTO> list(String communityName, String username, String tab,
                                                 int page, int size, String searchKeyword) {
        User currentUser = userService.getCurrentUser();
        Community community = resolveListCommunity(communityName, currentUser);
        if (username != null) userService.getActiveByUsername(username);

        Specification<Post> postSpecification = visibleTo(currentUser);
        if (community != null) postSpecification = postSpecification.and(inCommunity(community));
        if (username != null) postSpecification = postSpecification.and(writtenBy(username));
        if (searchKeyword != null && !searchKeyword.isBlank()) postSpecification = postSpecification.and(matchesText(searchKeyword));
        postSpecification = postSpecification.and(ordered(community != null, "popular".equals(tab)));

        return pageMapper.toResponse(
                postRepository.findAll(postSpecification, PageRequest.of(page, size)).map(p -> postSupport.toResponse(p, currentUser)));
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<PostResponseDTO> listSaved(int page, int size) {
        User user = userService.getCurrentUser();
        Specification<Post> savedByUser = savedBy(user);
        return pageMapper.toResponse(postRepository.findAll(visibleTo(user).and(savedByUser),
                PageRequest.of(page, size)).map(post -> postSupport.toResponse(post, user)));
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<TrashedPostResponseDTO> listTrash(int page, int size) {
        User user = userService.getCurrentUser();

        var pageable = PageRequest.of(page, size,
                Sort.by("deletedAt").descending()
                        .and(Sort.by("id").descending()));

        var result = postRepository.findByUserIdAndStatus(
                user.getId(), PostStatus.DELETED, pageable);

        return pageMapper.toResponse(result.map(post -> new TrashedPostResponseDTO(
                postSupport.toResponse(post, user),
                post.getDeletedAt(),
                PostService.canRestoreDeletedPost(post, user))));
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

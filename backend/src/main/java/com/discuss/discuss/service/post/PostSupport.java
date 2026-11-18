package com.discuss.discuss.service.post;

import com.discuss.discuss.dto.post.PostResponseDTO;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.PostContent;
import com.discuss.discuss.entity.PostMedia;
import com.discuss.discuss.entity.PostVote;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.exception.post.PostErrorCode;
import com.discuss.discuss.exception.post.PostException;
import com.discuss.discuss.mapper.post.PostMapper;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.repository.PostContentRepository;
import com.discuss.discuss.repository.PostMediaRepository;
import com.discuss.discuss.repository.PostRepository;
import com.discuss.discuss.repository.PostSaveRepository;
import com.discuss.discuss.repository.PostVoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Objects;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PostSupport {

    private final PostRepository postRepository;
    private final PostVoteRepository postVoteRepository;
    private final PostSaveRepository postSaveRepository;
    private final PostContentRepository postContentRepository;
    private final PostMediaRepository postMediaRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final PostMapper postMapper;

    public PostResponseDTO toResponse(Post post, User currentUser) {
        Long id = post.getId();
        return toResponse(post, findContent(post),
                postMediaRepository.findByPostIdOrderByDisplayOrderAsc(id), currentUser);
    }

    public PostResponseDTO toResponse(Post post, PostContent content, List<PostMedia> media, User currentUser) {
        Long id = post.getId();
        return postMapper.toResponse(post, content, media,
                postRepository.voteScore(id), postRepository.countComments(id),
                userVote(id, currentUser), postSaveRepository.existsByPostIdAndUserId(id, currentUser.getId()));
    }

    private VoteType userVote(Long id, User user) {
        return postVoteRepository.findByPostIdAndUserId(id, user.getId()).map(PostVote::getVoteType).orElse(null);
    }

    public PostContent findContent(Post post) {
        return postContentRepository.findByPostId(post.getId()).orElseThrow(this::notFound);
    }

    public void requireRead(Post post, User user) {
        Community community = post.getCommunity();
        if (community.getStatus() != CommunityStatus.ACTIVE) throw notFound();

        boolean isPrivateCommunity = community.getVisibility() == CommunityVisibility.PRIVATE;
        if (isPrivateCommunity && communityMemberRepository.findByCommunityAndUserAndStatus(
                community, user, MembershipStatus.ACTIVE).isEmpty()) {
            throw notFound();
        }
    }

    public PostException notFound() {
        return new PostException(PostErrorCode.POST_NOT_FOUND);
    }

    // ==================== HELPERS ====================

    public Post findPublished(Long id) {
        return postRepository.findById(id)
                .filter(p -> p.getStatus() == PostStatus.PUBLISHED)
                .orElseThrow(this::notFound);
    }

    public Post lockPublished(Long id) {
        return postRepository.lockById(id)
                .filter(post -> post.getStatus() == PostStatus.PUBLISHED)
                .orElseThrow(this::notFound);
    }

    public boolean canRestore(Post post, User user) {
        return Objects.equals(post.getUser().getId(), user.getId())
                && (post.getDeletedByUserId() == null
                || Objects.equals(post.getDeletedByUserId(), user.getId()));
    }

    public void requireAuthor(Post post, User user) {
        if (!Objects.equals(post.getUser().getId(), user.getId())) {
            throw new PostException(PostErrorCode.POST_EDIT_FORBIDDEN);
        }
    }
}

package com.discuss.discuss.service.post;

import com.discuss.discuss.dto.post.PostResponseDTO;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.PostSave;
import com.discuss.discuss.entity.PostVote;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.VoteType;
import com.discuss.discuss.repository.PostRepository;
import com.discuss.discuss.repository.PostSaveRepository;
import com.discuss.discuss.repository.PostVoteRepository;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostInteractionService {

    private final PostRepository postRepository;
    private final PostVoteRepository postVoteRepository;
    private final PostSaveRepository postSaveRepository;
    private final UserService userService;
    private final PostSupport postSupport;

    /** Sets the current user's vote; null removes it. The post lock serializes concurrent writes. */
    @Transactional
    public PostResponseDTO vote(Long id, VoteType type) {
        User user = userService.getCurrentUser();

        Post post = postRepository.lockById(id)
                .filter(p -> p.getStatus() == PostStatus.PUBLISHED)
                .orElseThrow(postSupport::notFound);

        postSupport.requireRead(post, user);
        PostVote existingVote = postVoteRepository.findByPostIdAndUserId(id, user.getId()).orElse(null);

        if (type == null) {
            if (existingVote != null) postVoteRepository.delete(existingVote);
        } else if (existingVote == null) {
            postVoteRepository.save(
                    PostVote.builder()
                            .post(post)
                            .user(user)
                            .voteType(type)
                            .build());
        } else {
            existingVote.setVoteType(type);
        }
        postVoteRepository.flush();
        return postSupport.toResponse(post, user);
    }

    @Transactional
    public PostResponseDTO savePost(Long id, boolean saved) {
        User user = userService.getCurrentUser();
        Post post = postRepository.lockById(id)
                .filter(p -> p.getStatus() == PostStatus.PUBLISHED).orElseThrow(postSupport::notFound);
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
}

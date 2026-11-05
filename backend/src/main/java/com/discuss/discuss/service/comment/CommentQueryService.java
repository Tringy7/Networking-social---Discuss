package com.discuss.discuss.service.comment;

import com.discuss.discuss.dto.comment.*;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.repository.*;
import com.discuss.discuss.service.post.PostSupport;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentQueryService {
    private final CommentRepository commentRepository;
    private final UserService userService;
    private final PostSupport postSupport;
    private final CommentSupport commentSupport;

    @Transactional(readOnly = true)
    public List<CommentResponseDTO> list(Long postId) {
        User user = userService.getCurrentUser();
        Post post = postSupport.findPublished(postId);
        postSupport.requireRead(post, user);

        return commentRepository.findByPostIdOrderByCreatedAtAscIdAsc(postId).stream()
                .map(commentSupport::toResponse).toList();
    }
}

package com.discuss.discuss.service.admin;

import com.discuss.discuss.dto.admin.AdminResponse.*;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.service.community.CommunityService;
import com.discuss.discuss.service.post.PostService;
import com.discuss.discuss.service.comment.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {
    private final UserService userService;
    private final CommunityService communityService;
    private final PostService postService;
    private final CommentService commentService;

    public Stats stats() {
        return new Stats(
                new StatusCounts(userService.countAll(), userService.countByStatus(UserStatus.ACTIVE),
                        userService.countByStatus(UserStatus.LOCKED)),
                new StatusCounts(communityService.countAll(), communityService.countByStatus(CommunityStatus.ACTIVE),
                        communityService.countByStatus(CommunityStatus.BANED)),
                new Total(postService.countAll()), new Total(commentService.countAll()));
    }

    public PageResponseDTO<UserItem> getUsers(Pageable pageable, String status) {
        return userService.findAllListUsers(pageable, toUserStatus(status));
    }

    public PageResponseDTO<UserItem> searchUsers(Pageable pageable, String search, String status) {
        return userService.searchAdminUsers(pageable, search, toUserStatus(status));
    }

    private UserStatus toUserStatus(String status) {
        if (status == null) {
            return null;
        }
        return switch (status) {
            case "ACTIVE" -> UserStatus.ACTIVE;
            case "SUSPENDED" -> UserStatus.LOCKED;
            default -> throw new IllegalArgumentException("Unsupported admin user status: " + status);
        };
    }
}

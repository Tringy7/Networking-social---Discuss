package com.discuss.discuss.service.admin;

import com.discuss.discuss.dto.admin.AdminResponse.UserItem;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.user.PublicUserProfileResponseDTO;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.service.user.UserProfileService;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManageUserService {
    private final UserService userService;
    private final UserProfileService userProfileService;

    public PageResponseDTO<UserItem> getUsers(Pageable pageable, String status) {
        return userService.getUsers(pageable, status);
    }

    public PageResponseDTO<UserItem> searchUsers(Pageable pageable, String search, String status) {
        return userService.searchUsers(pageable, search, status);
    }

    public PublicUserProfileResponseDTO getUserDetail(Long userId) {
        return userProfileService.getPublicUserProfileById(userId);
    }

    @Transactional
    public void lockUser(Long userId) {
        User user = userService.findUserById(userId);

        if (user.getStatus() == UserStatus.LOCKED) {
            return;
        }

        userService.checkUserStatus(user, UserStatus.ACTIVE);
        userService.saveStatusForUser(user, UserStatus.LOCKED);
    }

    @Transactional
    public void unlockUser(Long userId) {
        User user = userService.findUserById(userId);

        if (user.getStatus() == UserStatus.ACTIVE) {
            return;
        }

        userService.checkUserStatus(user, UserStatus.LOCKED);
        userService.saveStatusForUser(user, UserStatus.ACTIVE);
    }
}

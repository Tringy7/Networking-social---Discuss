package com.discuss.discuss.service.media;

import com.discuss.discuss.dto.media.StoredImageDTO;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityRole;
import com.discuss.discuss.enums.MembershipStatus;
import com.discuss.discuss.exception.media.MediaErrorCode;
import com.discuss.discuss.exception.media.MediaException;
import com.discuss.discuss.repository.CommunityMemberRepository;
import com.discuss.discuss.service.user.UserService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class PostService {

//    private final UserService userService;
//    private final CommunityMemberRepository communityMemberRepository;
//
//    @Transactional
//    public StoredImageDTO setCommunityIcon(Long communityId, MultipartFile file) {
//        User user = userService.getCurrentUser();
//
//        // 1. Quyền TRƯỚC khi upload
//        CommunityMember member = communityMemberRepository
//                .findByCommunityIdAndUserId(communityId, user.getId())
//                .filter(m -> m.getStatus() == MembershipStatus.ACTIVE)
//                .orElseThrow(() -> new MediaException(MediaErrorCode.MEDIA_ACCESS_DENIED));
//        if (member.getRole() == CommunityRole.MEMBER) {
//            throw new MediaException(MediaErrorCode.MEDIA_ACCESS_DENIED);
//        }
//
//        CommunityInfo info = communityInfoRepository.findByCommunityId(communityId)
//                .orElseThrow(() -> new MediaException(MediaErrorCode.MEDIA_NOT_FOUND));   // TODO: đổi sang CommunityException
//
//        // 2. Upload, lưu key mới, rồi dọn file theo kết quả transaction
//        var stored = storage.storeCommunityIcon(communityId, file);
//        String oldKey = info.getAvatar();
//        info.setAvatar(stored.objectKey());
//        communityInfoRepository.save(info);
//
//        mediaCleanup.deleteOnRollback(List.of(stored.objectKey()));
//        if (oldKey != null && oldKey.startsWith("communities/%d/icon/".formatted(communityId))) {
//            mediaCleanup.deleteAfterCommit(List.of(oldKey));
//        }
//        return stored;
//    }
}

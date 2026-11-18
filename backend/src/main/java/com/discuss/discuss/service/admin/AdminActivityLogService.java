package com.discuss.discuss.service.admin;
import com.discuss.discuss.dto.admin.AdminActivityLogResponseDTO;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
@Service
@RequiredArgsConstructor
@HasRole("ADMIN")
public class AdminActivityLogService {
    private final ActivityLogService activityLogService;
    public PageResponseDTO<AdminActivityLogResponseDTO> list(Long actorUserId, String action, String targetType, Pageable pageable) {
        return activityLogService.list(actorUserId, action, targetType, pageable);
    }
}

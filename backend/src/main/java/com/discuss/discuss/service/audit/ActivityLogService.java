package com.discuss.discuss.service.audit;
import com.discuss.discuss.dto.admin.AdminActivityLogResponseDTO;
import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.entity.AdminActivityLog;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.repository.AdminActivityLogRepository;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
@Service @RequiredArgsConstructor @HasRole("ADMIN")
public class ActivityLogService {
    private final AdminActivityLogRepository repository;
    private final UserService userService;
    private final PageMapper pageMapper;

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(String action, String targetType, Long targetId, String note) {
        var actor = userService.getCurrentUser();
        repository.save(AdminActivityLog.builder().actorUserId(actor.getId())
                .actorUsername(actor.getUsername()).action(action).targetType(targetType)
                .targetId(targetId).note(note).build());
    }

    @Transactional(readOnly = true)
    public PageResponseDTO<AdminActivityLogResponseDTO> list(Long actorUserId, String action, String targetType, Pageable pageable) {
        Specification<AdminActivityLog> filter = (root, query, cb) -> cb.and(
                actorUserId == null ? cb.conjunction() : cb.equal(root.get("actorUserId"), actorUserId),
                action == null || action.isBlank() ? cb.conjunction() : cb.equal(root.get("action"), action),
                targetType == null || targetType.isBlank() ? cb.conjunction() : cb.equal(root.get("targetType"), targetType));
        return pageMapper.toResponse(repository.findAll(filter, pageable).map(log -> new AdminActivityLogResponseDTO(
                log.getId(), log.getActorUserId(), log.getActorUsername(), log.getAction(), log.getTargetType(),
                log.getTargetId(), log.getNote(), log.getCreatedAt())));
    }
}

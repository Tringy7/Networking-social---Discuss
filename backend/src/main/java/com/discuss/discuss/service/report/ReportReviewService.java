package com.discuss.discuss.service.report;

import com.discuss.discuss.dto.report.ReportResponseDTO;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.exception.report.ReportErrorCode;
import com.discuss.discuss.exception.report.ReportException;
import com.discuss.discuss.mapper.report.ReportMapper;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor @HasRole("ADMIN")
public class ReportReviewService {
    private final EntityManager entityManager;
    private final ReportMapper mapper;
    private final UserService userService;

    @Transactional(readOnly = true)
    public ReportResponseDTO getDetail(ReportTargetType type, Long id) {
        return switch (type) {
            case POST -> mapper.toResponse(find(PostReport.class, id, false));
            case COMMENT -> mapper.toResponse(find(CommentReport.class, id, false));
            case COMMUNITY -> mapper.toResponse(find(CommunityReport.class, id, false));
        };
    }

    @Transactional
    public ReportResponseDTO review(ReportTargetType type, Long id, ReportStatus status, String note) {
        if (status != ReportStatus.RESOLVED && status != ReportStatus.REJECTED)
            throw new ReportException(ReportErrorCode.INVALID_REPORT_STATUS);
        if (note == null || note.isBlank() || note.length() > 2000)
            throw new ReportException(ReportErrorCode.INVALID_REVIEW_NOTE);
        User actor = userService.getCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        String action = status == ReportStatus.RESOLVED ? "REVIEWED" : "REJECTED";
        return switch (type) {
            case POST -> {
                var report = find(PostReport.class, id, true);
                requirePending(report.getStatus());
                report.setStatus(status); report.setHandledBy(actor); report.setHandledAt(now);
                report.setResolutionNote(note.strip()); report.setAction(action);
                yield mapper.toResponse(report);
            }
            case COMMENT -> {
                var report = find(CommentReport.class, id, true);
                requirePending(report.getStatus());
                report.setStatus(status); report.setHandledBy(actor); report.setHandledAt(now);
                report.setResolutionNote(note.strip()); report.setAction(action);
                yield mapper.toResponse(report);
            }
            case COMMUNITY -> {
                var report = find(CommunityReport.class, id, true);
                requirePending(report.getStatus());
                report.setStatus(status); report.setHandledBy(actor); report.setHandledAt(now);
                report.setResolutionNote(note.strip()); report.setAction(action);
                yield mapper.toResponse(report);
            }
        };
    }

    private void requirePending(ReportStatus status) {
        if (status != ReportStatus.PENDING) throw new ReportException(ReportErrorCode.REPORT_ALREADY_HANDLED);
    }

    private <T> T find(Class<T> type, Long id, boolean lock) {
        T report = lock ? entityManager.find(type, id, LockModeType.PESSIMISTIC_WRITE)
                : entityManager.find(type, id);
        if (report == null) throw new ReportException(ReportErrorCode.REPORT_NOT_FOUND);
        return report;
    }
}

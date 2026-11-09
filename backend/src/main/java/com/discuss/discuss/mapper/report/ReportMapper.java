package com.discuss.discuss.mapper.report;

import com.discuss.discuss.dto.report.ReportResponseDTO;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import org.springframework.stereotype.Component;

@Component
public class ReportMapper {
    public ReportResponseDTO toResponse(PostReport report) {
        return new ReportResponseDTO(report.getId(), ReportTargetType.POST, report.getPost().getId(),
                report.getPost().getCommunity().getName(), report.getUser().getUsername(),
                ReportReason.valueOf(report.getReason()), report.getDescription(), report.getStatus(),
                null, null, report.getHandledBy() == null ? null : report.getHandledBy().getUsername(),
                report.getHandledAt(), report.getCreatedAt());
    }

    public ReportResponseDTO toResponse(CommentReport report) {
        return new ReportResponseDTO(report.getId(), ReportTargetType.COMMENT, report.getComment().getId(),
                report.getComment().getPost().getCommunity().getName(), report.getReporter().getUsername(),
                ReportReason.valueOf(report.getReason()), report.getDescription(), report.getStatus(),
                null, null, report.getHandledBy() == null ? null : report.getHandledBy().getUsername(),
                report.getHandledAt(), report.getCreatedAt());
    }

    public ReportResponseDTO toResponse(CommunityReport report) {
        return new ReportResponseDTO(report.getId(), ReportTargetType.COMMUNITY, report.getCommunity().getId(),
                report.getCommunity().getName(), report.getUser().getUsername(),
                ReportReason.valueOf(report.getReason()), report.getDescription(), report.getStatus(),
                null, null, report.getHandledBy() == null ? null : report.getHandledBy().getUsername(),
                report.getHandledAt(), report.getCreatedAt());
    }

}

package com.discuss.discuss.service.report;

import com.discuss.discuss.dto.report.CreateReportRequestDTO;
import com.discuss.discuss.dto.report.ReportResponseDTO;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.ReportStatus;
import com.discuss.discuss.exception.report.ReportErrorCode;
import com.discuss.discuss.exception.report.ReportException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class ReportSupport {
    public String normalizeDescription(String description) {
        return description == null ? null : description.strip();
    }

    public ReportException notFound() {
        return new ReportException(ReportErrorCode.TARGET_NOT_FOUND);
    }

    public ReportResponseDTO response(
            Long id,
            CreateReportRequestDTO request,
            Community community,
            User reporter,
            String description,
            LocalDateTime createdAt
    ) {
        return new ReportResponseDTO(
                id,
                request.getTargetType(),
                request.getTargetId(),
                community.getName(),
                reporter.getUsername(),
                request.getReason(),
                description,
                ReportStatus.PENDING,
                null,
                null,
                null,
                null,
                createdAt
        );
    }
}

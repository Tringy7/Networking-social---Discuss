package com.discuss.discuss.repository;

import com.discuss.discuss.entity.CommentReport;
import com.discuss.discuss.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentReportRepository extends JpaRepository<CommentReport, Long> {
    boolean existsByCommentIdAndReporterIdAndStatus(Long targetId, Long reporterId, ReportStatus status);
}

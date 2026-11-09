package com.discuss.discuss.repository;

import com.discuss.discuss.entity.PostReport;
import com.discuss.discuss.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostReportRepository extends JpaRepository<PostReport, Long> {
    boolean existsByPostIdAndUserIdAndStatus(Long targetId, Long reporterId, ReportStatus status);
}

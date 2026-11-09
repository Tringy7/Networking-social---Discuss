package com.discuss.discuss.repository;

import com.discuss.discuss.entity.CommunityReport;
import com.discuss.discuss.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityReportRepository extends JpaRepository<CommunityReport, Long> {
    boolean existsByCommunityIdAndUserIdAndStatus(Long targetId, Long reporterId, ReportStatus status);
}

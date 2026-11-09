package com.discuss.discuss.repository;

import com.discuss.discuss.entity.CommunityReport;
import com.discuss.discuss.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

public interface CommunityReportRepository extends JpaRepository<CommunityReport, Long> {
    boolean existsByCommunityIdAndUserIdAndStatus(Long targetId, Long reporterId, ReportStatus status);

    @EntityGraph(attributePaths = {"community", "user", "handledBy"})
    @Query("select r from CommunityReport r where (:status is null or r.status = :status) "
            + "and (:communityName is null or r.community.name = :communityName)")
    Page<CommunityReport> findReports(@Param("status") ReportStatus status,
            @Param("communityName") String communityName, Pageable pageable);
}

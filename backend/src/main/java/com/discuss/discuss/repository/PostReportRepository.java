package com.discuss.discuss.repository;

import com.discuss.discuss.entity.PostReport;
import com.discuss.discuss.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

public interface PostReportRepository extends JpaRepository<PostReport, Long> {
    boolean existsByPostIdAndUserIdAndStatus(Long targetId, Long reporterId, ReportStatus status);

    @EntityGraph(attributePaths = {"post.community", "user", "handledBy"})
    @Query("select r from PostReport r where (:status is null or r.status = :status) "
            + "and (:communityName is null or r.post.community.name = :communityName)")
    Page<PostReport> findReports(@Param("status") ReportStatus status,
            @Param("communityName") String communityName, Pageable pageable);
}

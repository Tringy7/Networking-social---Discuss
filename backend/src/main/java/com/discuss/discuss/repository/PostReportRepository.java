package com.discuss.discuss.repository;

import com.discuss.discuss.entity.PostReport;
import com.discuss.discuss.dto.report.MyReportResponseDTO;
import com.discuss.discuss.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

public interface PostReportRepository extends JpaRepository<PostReport, Long> {
    @Query("""
            select new com.discuss.discuss.dto.report.MyReportResponseDTO(
                r.id, com.discuss.discuss.enums.ReportTargetType.POST, r.post.id,
                r.post.community.name, r.reason, r.description, r.status, r.createdAt, r.handledAt)
            from PostReport r where r.user.id = :reporterId and (:status is null or r.status = :status)
            """)
    Page<MyReportResponseDTO> findMine(@Param("reporterId") Long reporterId,
            @Param("status") ReportStatus status, Pageable pageable);

    boolean existsByPostIdAndUserIdAndStatus(Long targetId, Long reporterId, ReportStatus status);

    @EntityGraph(attributePaths = {"post.community", "user", "handledBy"})
    @Query("select r from PostReport r where (:status is null or r.status = :status) "
            + "and (:communityName is null or r.post.community.name = :communityName)")
    Page<PostReport> findReports(@Param("status") ReportStatus status,
            @Param("communityName") String communityName, Pageable pageable);
}

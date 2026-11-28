package com.discuss.discuss.repository;

import com.discuss.discuss.entity.CommentReport;
import com.discuss.discuss.dto.report.MyReportResponseDTO;
import com.discuss.discuss.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

public interface CommentReportRepository extends JpaRepository<CommentReport, Long> {
    @Query("""
            select new com.discuss.discuss.dto.report.MyReportResponseDTO(
                r.id, com.discuss.discuss.enums.ReportTargetType.COMMENT, r.comment.id,
                r.comment.post.community.name, r.reason, r.description, r.status, r.createdAt, r.handledAt)
            from CommentReport r where r.reporter.id = :reporterId and (:status is null or r.status = :status)
            """)
    Page<MyReportResponseDTO> findMine(@Param("reporterId") Long reporterId,
            @Param("status") ReportStatus status, Pageable pageable);

    boolean existsByCommentIdAndReporterIdAndStatus(Long targetId, Long reporterId, ReportStatus status);

    @EntityGraph(attributePaths = {"comment.post.community", "reporter", "handledBy"})
    @Query("select r from CommentReport r where (:status is null or r.status = :status) "
            + "and (:communityName is null or r.comment.post.community.name = :communityName)")
    Page<CommentReport> findReports(@Param("status") ReportStatus status,
            @Param("communityName") String communityName, Pageable pageable);
}

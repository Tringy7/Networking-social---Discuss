package com.discuss.discuss.repository;

import com.discuss.discuss.entity.CommentReport;
import com.discuss.discuss.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

public interface CommentReportRepository extends JpaRepository<CommentReport, Long> {
    boolean existsByCommentIdAndReporterIdAndStatus(Long targetId, Long reporterId, ReportStatus status);

    @EntityGraph(attributePaths = {"comment.post.community", "reporter", "handledBy"})
    @Query("select r from CommentReport r where (:status is null or r.status = :status) "
            + "and (:communityName is null or r.comment.post.community.name = :communityName)")
    Page<CommentReport> findReports(@Param("status") ReportStatus status,
            @Param("communityName") String communityName, Pageable pageable);
}

package com.discuss.discuss.repository;

import com.discuss.discuss.entity.ChatMessageReport;
import com.discuss.discuss.enums.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ChatMessageReportRepository extends JpaRepository<ChatMessageReport, Long> {
    boolean existsByMessageIdAndReporterIdAndStatus(Long messageId, Long reporterId, ReportStatus status);

    @Query("select r from ChatMessageReport r where :status is null or r.status = :status")
    Page<ChatMessageReport> list(ReportStatus status, Pageable pageable);

    @Query("select r from ChatMessageReport r where r.reporter.id = :reporterId and (:status is null or r.status = :status)")
    Page<ChatMessageReport> mine(Long reporterId, ReportStatus status, Pageable pageable);
}

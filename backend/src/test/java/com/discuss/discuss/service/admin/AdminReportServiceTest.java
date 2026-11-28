package com.discuss.discuss.service.admin;

import com.discuss.discuss.enums.ReportModerationAction;
import com.discuss.discuss.enums.ReportStatus;
import com.discuss.discuss.enums.ReportTargetType;
import com.discuss.discuss.exception.report.ReportErrorCode;
import com.discuss.discuss.exception.report.ReportException;
import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.service.comment.CommentService;
import com.discuss.discuss.service.report.CommentReportQueryService;
import com.discuss.discuss.service.report.CommunityReportQueryService;
import com.discuss.discuss.service.report.PostReportQueryService;
import com.discuss.discuss.service.report.ReportReviewService;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;

class AdminReportServiceTest {
    private final ReportReviewService review = mock(ReportReviewService.class);
    private final ActivityLogService audit = mock(ActivityLogService.class);
    private final AdminReportService reports = new AdminReportService(mock(PostReportQueryService.class),
            mock(CommentReportQueryService.class), mock(CommunityReportQueryService.class), review, audit,
            mock(AdminPostService.class), mock(AdminCommunityService.class), mock(CommentService.class));

    @ParameterizedTest
    @CsvSource({"POST, REJECTED, REMOVE_POST", "POST, RESOLVED, REMOVE_COMMENT", "COMMENT, RESOLVED, LOCK_COMMUNITY"})
    void rejectsInvalidModerationActionsBeforeChangingAnything(
            ReportTargetType target, ReportStatus status, ReportModerationAction action) {
        assertThatExceptionOfType(ReportException.class)
                .isThrownBy(() -> reports.review(target, 1L, status, "Reviewed", action))
                .extracting(ReportException::getError).isEqualTo(ReportErrorCode.INVALID_MODERATION_ACTION);
        verifyNoInteractions(review, audit);
    }
}

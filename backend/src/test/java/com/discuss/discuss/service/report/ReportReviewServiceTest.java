package com.discuss.discuss.service.report;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.exception.report.*;
import com.discuss.discuss.mapper.report.ReportMapper;
import com.discuss.discuss.service.user.UserService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class ReportReviewServiceTest {
    EntityManager entities;
    UserService users;
    ReportReviewService service;
    User admin;
    @BeforeEach void setup() {
        entities = mock(EntityManager.class); users = mock(UserService.class);
        admin = User.builder().id(1L).username("admin").role(UserRole.ADMIN).build();
        when(users.getCurrentUser()).thenReturn(admin);
        service = new ReportReviewService(entities, new ReportMapper(), users);
    }
    @Test void resolutionPersistsReviewerAndNoteWithRowLock() {
        var community = Community.builder().id(10L).name("java").build();
        var report = CommunityReport.builder().id(7L).community(community).user(admin)
                .reason("SPAM").status(ReportStatus.PENDING).build();
        when(entities.find(CommunityReport.class, 7L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(report);
        var result = service.review(ReportTargetType.COMMUNITY, 7L, ReportStatus.RESOLVED, "  Reviewed content  ");
        assertEquals(ReportStatus.RESOLVED, result.status());
        assertEquals("Reviewed content", result.resolutionNote());
        assertEquals("admin", result.resolvedBy());
        assertNotNull(result.resolvedAt());
        assertSame(admin, report.getHandledBy());
        assertEquals("REVIEWED", report.getAction());
    }
    @Test void cannotOverwriteAnAlreadyHandledReport() {
        var report = PostReport.builder().status(ReportStatus.RESOLVED).resolutionNote("Original decision").build();
        when(entities.find(PostReport.class, 2L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(report);
        var error = assertThrows(ReportException.class, () -> service.review(ReportTargetType.POST, 2L, ReportStatus.REJECTED, "Changed"));
        assertEquals(ReportErrorCode.REPORT_ALREADY_HANDLED, error.getError());
        assertEquals("Original decision", report.getResolutionNote());
    }
    @Test void rejectCommentReportRecordsReason() {
        var community = Community.builder().name("java").build();
        var comment = Comment.builder().id(3L).post(Post.builder().community(community).build()).build();
        var report = CommentReport.builder().id(2L).comment(comment).reporter(admin).reason("SPAM").status(ReportStatus.PENDING).build();
        when(entities.find(CommentReport.class, 2L, LockModeType.PESSIMISTIC_WRITE)).thenReturn(report);
        var result = service.review(ReportTargetType.COMMENT, 2L, ReportStatus.REJECTED, "No violation found");
        assertEquals(ReportStatus.REJECTED, result.status());
        assertEquals("REJECTED", result.action());
        assertEquals("No violation found", result.resolutionNote());
    }
    @Test void missingReportReturnsDomainNotFound() {
        var error = assertThrows(ReportException.class, () -> service.getDetail(ReportTargetType.POST, 999L));
        assertEquals(ReportErrorCode.REPORT_NOT_FOUND, error.getError());
    }
    @Test void pendingAndBlankNotesAreRejectedBeforeLoadingReports() {
        assertThrows(ReportException.class, () -> service.review(ReportTargetType.POST, 1L, ReportStatus.PENDING, "note"));
        assertThrows(ReportException.class, () -> service.review(ReportTargetType.POST, 1L, ReportStatus.RESOLVED, "  "));
        verifyNoInteractions(entities);
    }
}

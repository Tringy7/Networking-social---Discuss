package com.discuss.discuss.service.report;

import com.discuss.discuss.dto.report.*;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.exception.report.ReportException;
import com.discuss.discuss.exception.report.ReportErrorCode;
import com.discuss.discuss.repository.*;
import com.discuss.discuss.service.comment.CommentSupport;
import com.discuss.discuss.service.community.CommunitySupport;
import com.discuss.discuss.service.post.PostSupport;
import com.discuss.discuss.service.user.UserService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final UserService userService;
    private final EntityManager entityManager;
    private final ReportSupport reportSupport;
    private final PostSupport postSupport;
    private final CommunitySupport communitySupport;
    private final CommentSupport commentSupport;

    private final PostReportRepository postReports;
    private final CommentReportRepository commentReports;
    private final CommunityReportRepository communityReports;

    @Transactional
    public ReportResponseDTO create(CreateReportRequestDTO request) {
        User reporter = userService.getCurrentUser();

        entityManager.lock(reporter, LockModeType.PESSIMISTIC_WRITE);

        String description = reportSupport.normalizeDescription(request.getDescription());

        return switch (request.getTargetType()) {
            case POST -> createPostReport(request, reporter, description);
            case COMMENT -> createCommentReport(request, reporter, description);
            case COMMUNITY -> createCommunityReport(request, reporter, description);
        };
    }

    private ReportResponseDTO createPostReport(
            CreateReportRequestDTO request,
            User reporter,
            String description
    ) {
        Post post = postSupport.findPublished(request.getTargetId());

        Community community = post.getCommunity();
        communitySupport.checkCommunity(community, reporter);

        boolean duplicate = postReports.existsByPostIdAndUserIdAndStatus(
                post.getId(),
                reporter.getId(),
                ReportStatus.PENDING
        );

        checkDuplicate(duplicate);

        PostReport report = PostReport.builder()
                .post(post)
                .user(reporter)
                .reason(request.getReason().name())
                .description(description)
                .status(ReportStatus.PENDING)
                .build();

        report = postReports.saveAndFlush(report);

        return reportSupport.response(
                report.getId(),
                request,
                community,
                reporter,
                description,
                report.getCreatedAt()
        );
    }

    private ReportResponseDTO createCommentReport(
            CreateReportRequestDTO request,
            User reporter,
            String description
    ) {
        Comment comment = commentSupport.findComment(request.getTargetId());

        Community community = comment.getPost().getCommunity();
        communitySupport.checkCommunity(community, reporter);

        boolean duplicate = commentReports.existsByCommentIdAndReporterIdAndStatus(
                comment.getId(),
                reporter.getId(),
                ReportStatus.PENDING
        );

        checkDuplicate(duplicate);

        CommentReport report = CommentReport.builder()
                .comment(comment)
                .reporter(reporter)
                .reason(request.getReason().name())
                .description(description)
                .status(ReportStatus.PENDING)
                .build();

        report = commentReports.saveAndFlush(report);

        return reportSupport.response(
                report.getId(),
                request,
                community,
                reporter,
                description,
                report.getCreatedAt()
        );
    }

    private ReportResponseDTO createCommunityReport(
            CreateReportRequestDTO request,
            User reporter,
            String description
    ) {
        Community community = communitySupport.getCommunityById(request.getTargetId());
        communitySupport.checkCommunity(community, reporter);

        boolean duplicate = communityReports.existsByCommunityIdAndUserIdAndStatus(
                community.getId(),
                reporter.getId(),
                ReportStatus.PENDING
        );

        checkDuplicate(duplicate);

        CommunityReport report = CommunityReport.builder()
                .community(community)
                .user(reporter)
                .reason(request.getReason().name())
                .description(description)
                .status(ReportStatus.PENDING)
                .build();

        report = communityReports.saveAndFlush(report);

        return reportSupport.response(
                report.getId(),
                request,
                community,
                reporter,
                description,
                report.getCreatedAt()
        );
    }

    private void checkDuplicate(boolean exists) {
        if (exists) {
            throw new ReportException(ReportErrorCode.DUPLICATE_PENDING_REPORT);
        }
    }
}
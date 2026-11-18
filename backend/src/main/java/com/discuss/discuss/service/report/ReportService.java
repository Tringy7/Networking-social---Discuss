package com.discuss.discuss.service.report;

import com.discuss.discuss.dto.report.*;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.enums.ReportStatus;
import com.discuss.discuss.mapper.report.ReportMapper;
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

@Service
@RequiredArgsConstructor
public class ReportService {
    private final UserService userService;
    private final EntityManager entityManager;
    private final ReportSupport reportSupport;
    private final ReportMapper reportMapper;
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

    private ReportResponseDTO createPostReport(CreateReportRequestDTO request, User reporter, String description) {
        Post post = postSupport.findPublished(request.getTargetId());
        communitySupport.checkCommunity(post.getCommunity(), reporter);
        reportSupport.checkDuplicate(postReports.existsByPostIdAndUserIdAndStatus(
                post.getId(), reporter.getId(), ReportStatus.PENDING));

        PostReport report = PostReport.builder()
                .post(post)
                .user(reporter)
                .reason(request.getReason().name())
                .description(description)
                .status(ReportStatus.PENDING)
                .build();
        return reportMapper.toResponse(postReports.saveAndFlush(report));
    }

    private ReportResponseDTO createCommentReport(CreateReportRequestDTO request, User reporter, String description) {
        Comment comment = commentSupport.findComment(request.getTargetId());
        commentSupport.requireAvailablePost(comment.getPost());
        communitySupport.checkCommunity(comment.getPost().getCommunity(), reporter);
        reportSupport.checkDuplicate(commentReports.existsByCommentIdAndReporterIdAndStatus(
                comment.getId(), reporter.getId(), ReportStatus.PENDING));

        CommentReport report = CommentReport.builder()
                .comment(comment)
                .reporter(reporter)
                .reason(request.getReason().name())
                .description(description)
                .status(ReportStatus.PENDING)
                .build();
        return reportMapper.toResponse(commentReports.saveAndFlush(report));
    }

    private ReportResponseDTO createCommunityReport(CreateReportRequestDTO request, User reporter, String description) {
        Community community = communitySupport.getCommunityById(request.getTargetId());
        communitySupport.checkCommunity(community, reporter);
        reportSupport.checkDuplicate(communityReports.existsByCommunityIdAndUserIdAndStatus(
                community.getId(), reporter.getId(), ReportStatus.PENDING));

        CommunityReport report = CommunityReport.builder()
                .community(community)
                .user(reporter)
                .reason(request.getReason().name())
                .description(description)
                .status(ReportStatus.PENDING)
                .build();
        return reportMapper.toResponse(communityReports.saveAndFlush(report));
    }

}

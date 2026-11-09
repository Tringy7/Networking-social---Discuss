package com.discuss.discuss.service.report;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.report.ReportResponseDTO;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.mapper.report.ReportMapper;
import com.discuss.discuss.repository.CommentReportRepository;
import com.discuss.discuss.service.community.CommunitySupport;
import com.discuss.discuss.service.community.CommunityAuthorizationService;
import com.discuss.discuss.service.user.UserService;
import com.discuss.discuss.service.user.UserAuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentReportQueryService {
    private final CommentReportRepository repository;
    private final UserAuthorizationService userAuthorization;
    private final CommunitySupport communitySupport;
    private final ReportMapper reportMapper;
    private final PageMapper pageMapper;
    private final UserService userService;
    private final CommunityAuthorizationService communityAuthorization;

    public PageResponseDTO<ReportResponseDTO> list(ReportStatus status, String communityName, Pageable pageable) {
        userAuthorization.requireAdmin();
        String name = communitySupport.normalize(communityName);
        if (name != null && name.isBlank()) name = null;
        return pageMapper.toResponse(repository.findReports(status, name, pageable).map(reportMapper::toResponse));
    }

    public PageResponseDTO<ReportResponseDTO> listForCommunity(String name, ReportStatus status, Pageable pageable) {
        User user = userService.getCurrentUser();
        Community community = communitySupport.getCommunityByName(name);
        if (user.getRole() != UserRole.ADMIN) {
            communityAuthorization.requireModeratorOrOwner(community, user);
        }
        return pageMapper.toResponse(repository.findReports(status, community.getName(), pageable)
                .map(reportMapper::toResponse));
    }
}

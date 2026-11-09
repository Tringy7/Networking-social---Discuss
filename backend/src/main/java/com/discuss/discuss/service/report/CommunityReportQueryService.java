package com.discuss.discuss.service.report;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.report.ReportResponseDTO;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.entity.*;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.mapper.report.ReportMapper;
import com.discuss.discuss.repository.CommunityReportRepository;
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
public class CommunityReportQueryService {
    private final CommunityReportRepository repository;
    private final UserAuthorizationService userAuthorization;
    private final CommunitySupport communitySupport;
    private final ReportMapper reportMapper;
    private final PageMapper pageMapper;

    public PageResponseDTO<ReportResponseDTO> list(ReportStatus status, String communityName, Pageable pageable) {
        userAuthorization.requireAdmin();
        String name = communitySupport.normalize(communityName);
        if (name != null && name.isBlank()) name = null;
        return pageMapper.toResponse(repository.findReports(status, name, pageable).map(reportMapper::toResponse));
    }
}

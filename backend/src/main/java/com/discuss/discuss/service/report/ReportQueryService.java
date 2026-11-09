package com.discuss.discuss.service.report;

import com.discuss.discuss.dto.common.PageResponseDTO;
import com.discuss.discuss.dto.report.ReportResponseDTO;
import com.discuss.discuss.enums.*;
import com.discuss.discuss.mapper.page.PageMapper;
import com.discuss.discuss.repository.ReportQueryRepository;
import com.discuss.discuss.service.community.CommunitySupport;
import com.discuss.discuss.service.user.UserAuthorizationService;
import com.discuss.discuss.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import com.discuss.discuss.exception.report.ReportException;
import com.discuss.discuss.exception.report.ReportErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportQueryService {
    private final UserAuthorizationService userAuthorizationService;

    private final ReportQueryRepository reportQueryRepository;
    private final CommunitySupport communitySupport;

    private final PageMapper pageMapper;

    public PageResponseDTO<ReportResponseDTO> getListReports(
            ReportStatus status, ReportTargetType targetType,
            String communityName, Pageable pageable) {

        userAuthorizationService.requireAdmin();

        return pageMapper.toResponse(
                reportQueryRepository.findAll(
                        status,
                        targetType,
                        communitySupport.normalize(communityName),
                        pageable));
    }
}

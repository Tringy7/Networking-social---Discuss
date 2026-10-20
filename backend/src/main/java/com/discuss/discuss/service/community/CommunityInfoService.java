
package com.discuss.discuss.service.community;

import com.discuss.discuss.dto.community.CreateCommunityRequestDTO;
import com.discuss.discuss.entity.Category;
import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityInfo;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.exception.community.CommunityErrorCode;
import com.discuss.discuss.exception.community.CommunityException;
import com.discuss.discuss.repository.CommunityInfoRepository;
import com.discuss.discuss.service.media.MinioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommunityInfoService {

    private final CommunityInfoRepository infoRepository;
    private final CategoryService categoryService;
    private final MinioService minioService;

    @Transactional
    public CommunityInfo createCommunityInfo(
            Community community,
            CreateCommunityRequestDTO req
    ) {
        Category category =
                categoryService.getCategoryById(req.getCategoryId());


        String description = req.getDescription();

        if (description != null) {
            description = description.trim();
        }

        CommunityInfo info = CommunityInfo.builder()
                .community(community)
                .category(category)
                .description(description)
                .visibility(
                        req.getVisibility() == null
                                ? CommunityVisibility.PUBLIC
                                : req.getVisibility()
                )
                .status(CommunityStatus.ACTIVE)
                .build();

        return infoRepository.save(info);
    }

    public CommunityInfo getActiveInfo(Community community) {
        return infoRepository.findByCommunity(community)
                .filter(info ->
                        info.getStatus() == CommunityStatus.ACTIVE)
                .orElseThrow(() -> new CommunityException(
                        CommunityErrorCode.COMMUNITY_NOT_FOUND
                ));
    }

    public String buildImageUrl(String objectKey) {
        return objectKey == null
                ? null
                : minioService.buildFileUrl(objectKey);
    }
}

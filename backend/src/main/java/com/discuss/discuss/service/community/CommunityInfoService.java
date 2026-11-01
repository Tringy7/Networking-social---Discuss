
package com.discuss.discuss.service.community;

import com.discuss.discuss.dto.community.CreateCommunityRequestDTO;
import com.discuss.discuss.dto.community.UpdateCommunityRequestDTO;
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

        CommunityInfo info = CommunityInfo.builder()
                .community(community)
                .category(category)
                .description(description != null ? description.trim() : null)
                .build();

        return infoRepository.save(info);
    }

    @Transactional
    public CommunityInfo updateInfo(
            Community community,
            UpdateCommunityRequestDTO req
    ) {

        CommunityInfo info = this.getCommunityInfoByCommunity(community);

        if (req.getDescription() != null) {
            info.setDescription(req.getDescription().trim());
        }

        if (req.getCategoryId() != null) {
            info.setCategory(
                    categoryService.getCategoryById(req.getCategoryId())
            );
        }

        return infoRepository.save(info);
    }

    public CommunityInfo getCommunityInfoByCommunity(Community community) {
        return infoRepository.findByCommunity(community)
                .orElseThrow(() -> new CommunityException(
                        CommunityErrorCode.COMMUNITY_INFORMATION_NOT_FOUND
                ));
    }

    public String buildImageUrl(String objectKey) {
        return objectKey == null
                ? null
                : minioService.buildFileUrl(objectKey);
    }
}

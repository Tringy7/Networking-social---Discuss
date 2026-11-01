package com.discuss.discuss.service.community.spectification;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityInfo;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class CommunitySpecifications {
    public Specification<Community> buildPublicCommunitySpecification() {
        return (root, query, cb) -> {
            Join<Community, CommunityInfo> info =
                    root.join("info");

            return cb.and(
                    cb.equal(info.get("status"), CommunityStatus.ACTIVE),
                    cb.equal(info.get("visibility"), CommunityVisibility.PUBLIC)
            );
        };
    }

}

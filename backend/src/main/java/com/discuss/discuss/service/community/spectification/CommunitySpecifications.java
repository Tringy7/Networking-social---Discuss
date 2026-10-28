package com.discuss.discuss.service.community.spectification;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class CommunitySpecifications {
    public Specification<Community> buildPublicCommunitySpecification() {
        return (root, query, cb) -> {
            return cb.and(
                    cb.equal(root.get("status"), CommunityStatus.ACTIVE),
                    cb.equal(root.get("visibility"), CommunityVisibility.PUBLIC)
            );
        };
    }

}

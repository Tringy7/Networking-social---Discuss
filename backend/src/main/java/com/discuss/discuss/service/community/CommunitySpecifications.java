package com.discuss.discuss.service.community;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class CommunitySpecifications {
    public Specification<Community> hasStatus(CommunityStatus status) {
        return (root, query, cb) -> status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    public Specification<Community> hasVisibility(CommunityVisibility visibility) {
        return (root, query, cb) -> visibility == null ? cb.conjunction() : cb.equal(root.get("visibility"), visibility);
    }

    public Specification<Community> matchesName(String search) {
        return (root, query, cb) -> cb.greaterThan(
                cb.locate(cb.lower(root.get("name")), cb.lower(cb.literal(search.trim()))), 0);
    }

    public Specification<Community> buildPublicCommunitySpecification() {
        return (root, query, cb) -> {
            return cb.and(
                    cb.equal(root.get("status"), CommunityStatus.ACTIVE),
                    cb.equal(root.get("visibility"), CommunityVisibility.PUBLIC)
            );
        };
    }

}

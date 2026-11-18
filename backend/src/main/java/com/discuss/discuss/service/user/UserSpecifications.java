package com.discuss.discuss.service.user;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.UserStatus;
import com.discuss.discuss.enums.UserRole;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class UserSpecifications {
    public Specification<User> matchesUsernameOrDisplayName(String search) {
        return (root, query, cb) -> {
            var profile = root.join("profile", JoinType.LEFT);
            var keyword = cb.lower(cb.literal(search));
            return cb.or(
                    cb.greaterThan(cb.locate(cb.lower(root.get("username")), keyword), 0),
                    cb.greaterThan(cb.locate(cb.lower(profile.get("displayName")), keyword), 0)
            );
        };
    }

    public Specification<User> hasRole(UserRole role) {
        return (root, query, cb) -> role == null
                ? cb.conjunction()
                : cb.equal(root.get("role"), role);
    }

    public Specification<User> hasStatus(UserStatus status) {
        return (root, query, cb) -> status == null
                ? cb.conjunction()
                : cb.equal(root.get("status"), status);
    }

    public Specification<User> matchesUsernameOrEmail(String search) {
        return (root, query, cb) -> {
            var keyword = cb.lower(cb.literal(search.trim()));
            return cb.or(
                    cb.greaterThan(cb.locate(cb.lower(root.get("username")), keyword), 0),
                    cb.greaterThan(cb.locate(cb.lower(root.get("email")), keyword), 0)
            );
        };
    }
}

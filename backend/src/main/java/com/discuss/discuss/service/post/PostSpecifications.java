package com.discuss.discuss.service.post;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityMember;
import com.discuss.discuss.entity.Post;
import com.discuss.discuss.entity.PostContent;
import com.discuss.discuss.entity.PostSave;
import com.discuss.discuss.entity.PostVote;
import com.discuss.discuss.entity.User;
import com.discuss.discuss.enums.CommunityStatus;
import com.discuss.discuss.enums.CommunityVisibility;
import com.discuss.discuss.enums.MembershipStatus;
import com.discuss.discuss.enums.PostStatus;
import com.discuss.discuss.enums.VoteType;
import jakarta.persistence.criteria.Order;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class PostSpecifications {

    public Specification<Post> buildFeedSpecification(
            User currentUser, Community community, String username, String tab, String search) {
        return visibleTo(currentUser)
                .and(inCommunity(community))
                .and(writtenBy(username))
                .and(matchesText(search))
                .and(ordered(community != null, "popular".equals(tab)));
    }

    public Specification<Post> buildSavedSpecification(User user) {
        return visibleTo(user).and(savedBy(user));
    }

    public Specification<Post> buildTrashSpecification(User user) {
        return writtenByUserId(user.getId()).and(hasStatus(PostStatus.DELETED));
    }

    public Specification<Post> buildManagementSpecification(
            PostStatus status, String communityName, String search) {
        return hasStatus(status)
                .and(hasCommunityName(communityName))
                .and(matchesText(search == null ? null : search.trim()));
    }

    private Specification<Post> hasStatus(PostStatus status) {
        return (root, query, cb) -> status == null
                ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    private Specification<Post> hasCommunityName(String communityName) {
        return (root, query, cb) -> communityName == null || communityName.isBlank()
                ? cb.conjunction() : cb.equal(root.get("community").get("name"), communityName);
    }

    private Specification<Post> writtenByUserId(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    /** Post đã đăng, community còn hoạt động, và (community public hoặc currentUser là memberRoot active). */
    private Specification<Post> visibleTo(User currentUser) {
        return (postRoot, criteriaQuery, criteriaBuilder) -> {
            var membershipQuery = criteriaQuery.subquery(Long.class);
            var memberRoot = membershipQuery.from(CommunityMember.class);
            membershipQuery.select(memberRoot.get("id")).where(
                    criteriaBuilder.equal(memberRoot.get("community"), postRoot.get("community")),
                    criteriaBuilder.equal(memberRoot.get("user").get("id"), currentUser.getId()),
                    criteriaBuilder.equal(memberRoot.get("status"), MembershipStatus.ACTIVE));

            return criteriaBuilder.and(
                    criteriaBuilder.equal(postRoot.get("status"), PostStatus.PUBLISHED),
                    criteriaBuilder.equal(postRoot.get("community").get("status"), CommunityStatus.ACTIVE),
                    criteriaBuilder.or(criteriaBuilder.equal(postRoot.get("community").get("visibility"), CommunityVisibility.PUBLIC),
                            criteriaBuilder.exists(membershipQuery)));
        };
    }

    private Specification<Post> inCommunity(Community community) {
        return (postRoot, criteriaQuery, criteriaBuilder) -> community == null
                ? criteriaBuilder.conjunction() : criteriaBuilder.equal(postRoot.get("community"), community);
    }

    private Specification<Post> writtenBy(String username) {
        return (postRoot, criteriaQuery, criteriaBuilder) -> username == null
                ? criteriaBuilder.conjunction() : criteriaBuilder.equal(postRoot.get("user").get("username"), username);
    }

    /** Tìm trong title và nội dung Markdown. */
    private Specification<Post> matchesText(String searchKeyword) {
        if (searchKeyword == null || searchKeyword.isBlank()) {
            return (root, query, cb) -> cb.conjunction();
        }
        String searchPattern = likePattern(searchKeyword);
        return (postRoot, criteriaQuery, criteriaBuilder) -> {
            var contentQuery = criteriaQuery.subquery(Long.class);
            var contentRoot = contentQuery.from(PostContent.class);

            contentQuery.select(contentRoot.get("id")).where(
                    criteriaBuilder.equal(contentRoot.get("post"), postRoot),
                    criteriaBuilder.or(criteriaBuilder.like(criteriaBuilder.lower(contentRoot.get("title")), searchPattern, '!'),
                            criteriaBuilder.like(criteriaBuilder.lower(contentRoot.get("content")), searchPattern, '!')));
            return criteriaBuilder.exists(contentQuery);
        };
    }

    /** Chỉ áp dụng ORDER BY cho criteriaQuery lấy dữ liệu, bỏ qua criteriaQuery count. */
    private Specification<Post> ordered(boolean sortPinnedFirst, boolean sortByPopularity) {
        return (postRoot, criteriaQuery, criteriaBuilder) -> {
            if (criteriaQuery.getResultType() == Long.class) return null;

            List<Order> sortOrders = new ArrayList<>();
            if (sortPinnedFirst) sortOrders.add(criteriaBuilder.desc(postRoot.get("isPinned")));
            if (sortByPopularity) {
                var voteScoreQuery = criteriaQuery.subquery(Long.class);
                var voteRoot = voteScoreQuery.from(PostVote.class);
                voteScoreQuery.select(criteriaBuilder.coalesce(criteriaBuilder.sum(criteriaBuilder.<Long>selectCase()
                        .when(criteriaBuilder.equal(voteRoot.get("voteType"), VoteType.UP), 1L)
                        .otherwise(-1L)), 0L)).where(criteriaBuilder.equal(voteRoot.get("post"), postRoot));
                sortOrders.add(criteriaBuilder.desc(voteScoreQuery));
            }
            sortOrders.add(criteriaBuilder.desc(postRoot.get("createdAt")));
            sortOrders.add(criteriaBuilder.desc(postRoot.get("id")));
            criteriaQuery.orderBy(sortOrders);
            return null;
        };
    }

    /** Escape ký tự đặc biệt của LIKE (dùng '!' làm escape char). */
    private static String likePattern(String searchKeyword) {
        String escapedKeyword = searchKeyword.toLowerCase(Locale.ROOT)
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
        return "%" + escapedKeyword + "%";
    }

    private Specification<Post> savedBy(User user) {
        return (root, query, cb) -> {
            var saves = query.subquery(Long.class);
            var saved = saves.from(PostSave.class);
            saves.select(saved.get("id")).where(cb.equal(saved.get("post"), root),
                    cb.equal(saved.get("user").get("id"), user.getId()));
            if (query.getResultType() != Long.class) {
                query.orderBy(cb.desc(saves), cb.desc(root.get("id")));
            }
            return cb.exists(saves);
        };
    }
}

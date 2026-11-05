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

public final class PostSpecifications {

    private PostSpecifications() {}

    /** Post đã đăng, community còn hoạt động, và (community public hoặc currentUser là memberRoot active). */
    public static Specification<Post> visibleTo(User currentUser) {
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

    public static Specification<Post> inCommunity(Community community) {
        return (postRoot, criteriaQuery, criteriaBuilder) -> criteriaBuilder.equal(postRoot.get("community"), community);
    }

    public static Specification<Post> writtenBy(String username) {
        return (postRoot, criteriaQuery, criteriaBuilder) -> criteriaBuilder.equal(postRoot.get("user").get("username"), username);
    }

    /** Tìm trong title và nội dung Markdown. */
    public static Specification<Post> matchesText(String searchKeyword) {
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
    public static Specification<Post> ordered(boolean sortPinnedFirst, boolean sortByPopularity) {
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

    public static Specification<Post> savedBy(User user) {
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

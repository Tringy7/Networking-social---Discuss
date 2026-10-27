package com.discuss.discuss.repository;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUser(User user);

    @Query("""
            select p from UserProfile p join fetch p.user u
            where u.status = com.discuss.discuss.enums.UserStatus.ACTIVE
              and (lower(u.username) like lower(concat('%', :query, '%'))
                   or lower(coalesce(p.displayName, '')) like lower(concat('%', :query, '%'))
                   or lower(coalesce(p.bio, '')) like lower(concat('%', :query, '%')))
            order by p.displayName asc
            """)
    List<UserProfile> searchActiveProfiles(
            @Param("query") String query,
            org.springframework.data.domain.Pageable pageable
    );
}

package com.discuss.discuss.repository;

import com.discuss.discuss.entity.User;
import com.discuss.discuss.entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUser(User user);
}

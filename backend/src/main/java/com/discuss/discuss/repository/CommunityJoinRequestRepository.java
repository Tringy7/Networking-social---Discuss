package com.discuss.discuss.repository;

import com.discuss.discuss.entity.Community;
import com.discuss.discuss.entity.CommunityJoinRequest;
import com.discuss.discuss.entity.CommunityJoinRequest.Status;
import com.discuss.discuss.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommunityJoinRequestRepository extends JpaRepository<CommunityJoinRequest, Long> {

    Optional<CommunityJoinRequest> findByCommunityAndApplicantAndStatus(
            Community community, User applicant, Status status);

    Optional<CommunityJoinRequest> findByIdAndCommunity(Long id, Community community);

    @EntityGraph(attributePaths = {"applicant", "reviewer"})
    Page<CommunityJoinRequest> findByCommunityAndStatus(Community community, Status status, Pageable pageable);

    @EntityGraph(attributePaths = {"applicant", "reviewer"})
    Page<CommunityJoinRequest> findByCommunityAndStatusNot(Community community, Status status, Pageable pageable);
}

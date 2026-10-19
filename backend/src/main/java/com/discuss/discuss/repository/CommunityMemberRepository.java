package com.discuss.discuss.repository;

import com.discuss.discuss.entity.CommunityMember;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityMemberRepository extends JpaRepository<CommunityMember, Long> {

}

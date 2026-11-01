package com.discuss.discuss.repository;

import com.discuss.discuss.entity.BanHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BanHistoryRepository extends JpaRepository<BanHistory, Long> {
}

package com.discuss.discuss.repository;

import com.discuss.discuss.entity.OutboxEvent;
import com.discuss.discuss.enums.OutboxStatus;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {
    @Query("""
            select e.id from OutboxEvent e
            where e.status = :status and e.nextAttemptAt <= :now
            order by e.nextAttemptAt, e.id
            """)
    List<Long> findDueIds(@Param("status") OutboxStatus status, @Param("now") LocalDateTime now, Pageable limit);
}

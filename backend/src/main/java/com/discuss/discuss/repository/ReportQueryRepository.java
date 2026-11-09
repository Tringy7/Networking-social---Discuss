package com.discuss.discuss.repository;

import com.discuss.discuss.dto.report.ReportResponseDTO;
import com.discuss.discuss.enums.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class ReportQueryRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public Page<ReportResponseDTO> findAll(ReportStatus status, ReportTargetType targetType,
            String communityName, Pageable pageable) {
        return findReports(status, targetType, communityName, pageable, true);
    }

    public Page<ReportResponseDTO> findForCommunity(ReportStatus status, ReportTargetType targetType,
            String communityName, Pageable pageable) {
        return findReports(status, targetType, communityName, pageable, false);
    }

    private Page<ReportResponseDTO> findReports(ReportStatus status, ReportTargetType targetType,
            String communityName, Pageable pageable, boolean includeCommunityReports) {
        List<String> sources = new ArrayList<>();
        if (targetType == null || targetType == ReportTargetType.POST) {
            sources.add(source("post_reports", "POST", "r.post_id", "r.user_id",
                    "join posts p on p.id = r.post_id join communities c on c.id = p.community_id"));
        }
        if (targetType == null || targetType == ReportTargetType.COMMENT) {
            sources.add(source("comment_reports", "COMMENT", "r.comment_id", "r.reporter_id",
                    "join comments cm on cm.id = r.comment_id join posts p on p.id = cm.post_id "
                            + "join communities c on c.id = p.community_id"));
        }
        if (includeCommunityReports && (targetType == null || targetType == ReportTargetType.COMMUNITY)) {
            sources.add(source("community_reports", "COMMUNITY", "r.community_id", "r.user_id",
                    "join communities c on c.id = r.community_id"));
        }
        if (sources.isEmpty()) {
            return Page.empty(pageable);
        }
        String from = " from (" + String.join(" union all ", sources) + ") reports where 1=1";
        MapSqlParameterSource params = new MapSqlParameterSource();
        if (status != null) {
            from += " and status = :status";
            params.addValue("status", status.name());
        }
        if (communityName != null && !communityName.isBlank()) {
            from += " and community_name = :communityName";
            params.addValue("communityName", communityName);
        }
        Long total = jdbc.queryForObject("select count(*)" + from, params, Long.class);
        params.addValue("limit", pageable.getPageSize()).addValue("offset", pageable.getOffset());
        List<ReportResponseDTO> content = jdbc.query("select *" + from
                + " order by created_at desc, target_type asc, id desc limit :limit offset :offset",
                params, this::mapReport);
        return new PageImpl<>(content, pageable, total == null ? 0 : total);
    }

    // Only internal constants are interpolated; request filters are bound parameters.
    private String source(String table, String type, String targetId, String reporterId, String joins) {
        return "select r.id, '" + type + "' as target_type, " + targetId + " as target_id, "
                + "c.name as community_name, u.username as reporter_username, r.reason, r.description, "
                + "r.status, handler.username as resolved_by, r.handled_at, r.created_at from " + table + " r "
                + joins + " join users u on u.id = " + reporterId
                + " left join users handler on handler.id = r.handled_by";
    }

    private ReportResponseDTO mapReport(ResultSet row, int rowNumber) throws SQLException {
        return new ReportResponseDTO(row.getLong("id"), ReportTargetType.valueOf(row.getString("target_type")),
                row.getLong("target_id"), row.getString("community_name"), row.getString("reporter_username"),
                ReportReason.valueOf(row.getString("reason")), row.getString("description"),
                ReportStatus.valueOf(row.getString("status")), null, null, row.getString("resolved_by"),
                row.getObject("handled_at", LocalDateTime.class), row.getObject("created_at", LocalDateTime.class));
    }
}

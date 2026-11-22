package com.discuss.discuss.service.admin;

import com.discuss.discuss.dto.admin.ReputationThresholdsDTO;
import com.discuss.discuss.entity.ReputationSettings;
import com.discuss.discuss.repository.ReputationSettingsRepository;
import com.discuss.discuss.service.audit.ActivityLogService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@HasRole("ADMIN")
public class AdminReputationService {
    private final ReputationSettingsRepository settings;
    private final ActivityLogService activityLog;

    @Transactional
    public ReputationThresholdsDTO updateThresholds(ReputationThresholdsDTO thresholds) {
        settings.save(new ReputationSettings(
                thresholds.contributor(),
                thresholds.trusted(),
                thresholds.highlyTrusted()));

        activityLog.record("UPDATE_REPUTATION_THRESHOLDS", "REPUTATION_SETTINGS", ReputationSettings.SYSTEM_ID,
                "Contributor: %d, trusted: %d, highly trusted: %d".formatted(
                        thresholds.contributor(), thresholds.trusted(), thresholds.highlyTrusted()));
        return thresholds;
    }
}

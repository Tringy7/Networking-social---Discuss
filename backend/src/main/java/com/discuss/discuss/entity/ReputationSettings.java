package com.discuss.discuss.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "reputation_settings")
@Getter
@NoArgsConstructor
public class ReputationSettings {
    public static final long SYSTEM_ID = 1L;

    @Id
    private Long id;

    @Column(nullable = false)
    private int contributorThreshold;

    @Column(nullable = false)
    private int trustedThreshold;

    @Column(nullable = false)
    private int highlyTrustedThreshold;

    public ReputationSettings(int contributorThreshold, int trustedThreshold, int highlyTrustedThreshold) {
        this.id = SYSTEM_ID;
        this.contributorThreshold = contributorThreshold;
        this.trustedThreshold = trustedThreshold;
        this.highlyTrustedThreshold = highlyTrustedThreshold;
    }
}

package com.discuss.discuss.controller.admin;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.discuss.discuss.dto.admin.ReputationThresholdsDTO;
import com.discuss.discuss.service.admin.AdminReputationService;
import com.discuss.discuss.service.user.UserReputationService;
import com.discuss.discuss.utils.annotation.auth.HasRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/admin/reputation/thresholds")
@RequiredArgsConstructor
@HasRole("ADMIN")
public class ManageReputationController {
    private final UserReputationService reputation;
    private final AdminReputationService adminReputation;

    public record ThresholdsRequest(
            @NotNull @Positive @Digits(integer = 10, fraction = 0) @DecimalMax("2147483647") BigDecimal contributor,
            @NotNull @Positive @Digits(integer = 10, fraction = 0) @DecimalMax("2147483647") BigDecimal trusted,
            @NotNull @Positive @Digits(integer = 10, fraction = 0) @DecimalMax("2147483647") BigDecimal highlyTrusted
    ) {
        @JsonIgnore
        @AssertTrue(message = "Reputation thresholds must be strictly increasing")
        public boolean isIncreasing() {
            return contributor == null || trusted == null || highlyTrusted == null
                    || (contributor.compareTo(trusted) < 0 && trusted.compareTo(highlyTrusted) < 0);
        }
    }

    @GetMapping
    public ReputationThresholdsDTO getThresholds() {
        return reputation.getThresholds();
    }

    @PutMapping
    public ReputationThresholdsDTO updateThresholds(@Valid @RequestBody ThresholdsRequest request) {
        return adminReputation.updateThresholds(new ReputationThresholdsDTO(
                request.contributor().intValueExact(),
                request.trusted().intValueExact(),
                request.highlyTrusted().intValueExact()));
    }
}

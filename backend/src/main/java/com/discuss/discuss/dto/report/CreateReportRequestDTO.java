package com.discuss.discuss.dto.report;

import com.discuss.discuss.enums.ReportReason;
import com.discuss.discuss.enums.ReportTargetType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateReportRequestDTO {
    @NotNull
    private ReportTargetType targetType;

    @NotNull
    @Positive
    private Long targetId;

    @NotNull
    private ReportReason reason;

    @Size(max = 2000)
    private String description;

    @AssertTrue(message = "Description is required when reason is OTHER")
    public boolean isDescriptionValid() {
        return reason != ReportReason.OTHER || (description != null && !description.isBlank());
    }
}

package com.discuss.discuss.dto.report;

import com.discuss.discuss.enums.ReportStatus;
import com.discuss.discuss.enums.ReportTargetType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.domain.PageRequest;

@Getter
@Setter
public class ReportQueryRequestDTO {
    private ReportStatus status;
    private ReportTargetType targetType;

    @Min(0)
    private int page = 0;

    @Min(1)
    @Max(100)
    private int size = 20;

    public PageRequest toPageable() {
        return PageRequest.of(page, size);
    }
}

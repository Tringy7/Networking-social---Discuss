package com.discuss.discuss.service.report;

import com.discuss.discuss.exception.report.ReportErrorCode;
import com.discuss.discuss.exception.report.ReportException;
import org.springframework.stereotype.Service;

@Service
public class ReportSupport {
    public String normalizeDescription(String description) {
        return description == null ? null : description.strip();
    }

    public void checkDuplicate(boolean exists) {
        if (exists) {
            throw new ReportException(ReportErrorCode.DUPLICATE_PENDING_REPORT);
        }
    }
}

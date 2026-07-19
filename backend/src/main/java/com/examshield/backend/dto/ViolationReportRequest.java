package com.examshield.backend.dto;

import com.examshield.backend.model.ViolationType;
import jakarta.validation.constraints.NotNull;

public class ViolationReportRequest {
    @NotNull(message = "Violation type is required")
    private ViolationType type;

    public ViolationReportRequest() {}

    public ViolationReportRequest(ViolationType type) {
        this.type = type;
    }

    public ViolationType getType() {
        return type;
    }

    public void setType(ViolationType type) {
        this.type = type;
    }
}

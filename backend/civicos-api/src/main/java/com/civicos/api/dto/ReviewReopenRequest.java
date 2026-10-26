package com.civicos.api.dto;

import jakarta.validation.constraints.NotNull;

public class ReviewReopenRequest {

    @NotNull(message = "Decision is required")
    private Boolean approved;

    public Boolean getApproved() {
        return approved;
    }

    public void setApproved(Boolean approved) {
        this.approved = approved;
    }
}

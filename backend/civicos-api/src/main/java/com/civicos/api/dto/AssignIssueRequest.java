package com.civicos.api.dto;

import jakarta.validation.constraints.NotNull;

public class AssignIssueRequest {

    @NotNull(message = "Assigned user ID is required")
    private Long assignedTo;

    public AssignIssueRequest() {
    }

    public Long getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(Long assignedTo) {
        this.assignedTo = assignedTo;
    }
}
package com.civicos.api.dto;

import com.civicos.api.entity.IssueStatus;

import jakarta.validation.constraints.NotNull;

public class UpdateIssueStatusRequest {

    @NotNull(message = "Status is required")
    private IssueStatus status;

    public UpdateIssueStatusRequest() {
    }

    public IssueStatus getStatus() {
        return status;
    }

    public void setStatus(IssueStatus status) {
        this.status = status;
    }
}
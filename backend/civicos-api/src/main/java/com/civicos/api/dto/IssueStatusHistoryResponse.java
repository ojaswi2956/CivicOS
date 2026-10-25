package com.civicos.api.dto;

public class IssueStatusHistoryResponse {

    private String status;
    private String changedAt;
    private Long changedBy;
    private String changedByName;

    public IssueStatusHistoryResponse() {
    }

    public IssueStatusHistoryResponse(
            String status,
            String changedAt,
            Long changedBy,
            String changedByName
    ) {
        this.status = status;
        this.changedAt = changedAt;
        this.changedBy = changedBy;
        this.changedByName = changedByName;
    }

    public String getStatus() {
        return status;
    }

    public String getChangedAt() {
        return changedAt;
    }

    public Long getChangedBy() {
        return changedBy;
    }

    public String getChangedByName() {
        return changedByName;
    }
}
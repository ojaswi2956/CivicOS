package com.civicos.api.dto;

public class IssueStatusHistoryResponse {

    private String status;
    private String changedAt;
    private Long changedBy;

    public IssueStatusHistoryResponse() {
    }

    public IssueStatusHistoryResponse(
            String status,
            String changedAt,
            Long changedBy
    ) {
        this.status = status;
        this.changedAt = changedAt;
        this.changedBy = changedBy;
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
}
package com.civicos.api.dto;

import java.util.List;

public class DashboardAttentionResponse {

    private long overdueCount;
    private long unassignedCount;
    private List<DashboardAttentionIssueResponse> issues;

    public DashboardAttentionResponse(
            long overdueCount,
            long unassignedCount,
            List<DashboardAttentionIssueResponse> issues
    ) {
        this.overdueCount = overdueCount;
        this.unassignedCount = unassignedCount;
        this.issues = issues;
    }

    public long getOverdueCount() {
        return overdueCount;
    }

    public long getUnassignedCount() {
        return unassignedCount;
    }

    public List<DashboardAttentionIssueResponse> getIssues() {
        return issues;
    }
}

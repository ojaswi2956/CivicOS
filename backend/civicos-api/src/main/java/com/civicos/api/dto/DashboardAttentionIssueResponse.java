package com.civicos.api.dto;

public class DashboardAttentionIssueResponse {

    private IssueResponse issue;
    private boolean overdue;
    private boolean unassigned;

    public DashboardAttentionIssueResponse(
            IssueResponse issue,
            boolean overdue,
            boolean unassigned
    ) {
        this.issue = issue;
        this.overdue = overdue;
        this.unassigned = unassigned;
    }

    public IssueResponse getIssue() {
        return issue;
    }

    public boolean isOverdue() {
        return overdue;
    }

    public boolean isUnassigned() {
        return unassigned;
    }
}

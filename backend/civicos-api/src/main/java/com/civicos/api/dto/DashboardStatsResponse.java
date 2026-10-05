package com.civicos.api.dto;

public class DashboardStatsResponse {

    private long totalIssues;

    private long reported;
    private long verified;
    private long assigned;
    private long inProgress;
    private long resolved;
    private long closed;

    private long lowPriority;
    private long mediumPriority;
    private long highPriority;
    private long criticalPriority;

    public DashboardStatsResponse() {
    }

    public DashboardStatsResponse(
            long totalIssues,
            long reported,
            long verified,
            long assigned,
            long inProgress,
            long resolved,
            long closed,
            long lowPriority,
            long mediumPriority,
            long highPriority,
            long criticalPriority
    ) {
        this.totalIssues = totalIssues;
        this.reported = reported;
        this.verified = verified;
        this.assigned = assigned;
        this.inProgress = inProgress;
        this.resolved = resolved;
        this.closed = closed;
        this.lowPriority = lowPriority;
        this.mediumPriority = mediumPriority;
        this.highPriority = highPriority;
        this.criticalPriority = criticalPriority;
    }

    public long getTotalIssues() {
        return totalIssues;
    }

    public long getReported() {
        return reported;
    }

    public long getVerified() {
        return verified;
    }

    public long getAssigned() {
        return assigned;
    }

    public long getInProgress() {
        return inProgress;
    }

    public long getResolved() {
        return resolved;
    }

    public long getClosed() {
        return closed;
    }

    public long getLowPriority() {
        return lowPriority;
    }

    public long getMediumPriority() {
        return mediumPriority;
    }

    public long getHighPriority() {
        return highPriority;
    }

    public long getCriticalPriority() {
        return criticalPriority;
    }
}
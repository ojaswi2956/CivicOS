package com.civicos.api.dto;

public class DepartmentStatsResponse {

    private long totalAssigned;
    private long assigned;
    private long inProgress;
    private long resolved;

    public DepartmentStatsResponse() {
    }

    public DepartmentStatsResponse(
            long totalAssigned,
            long assigned,
            long inProgress,
            long resolved
    ) {
        this.totalAssigned = totalAssigned;
        this.assigned = assigned;
        this.inProgress = inProgress;
        this.resolved = resolved;
    }

    public long getTotalAssigned() {
        return totalAssigned;
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
}
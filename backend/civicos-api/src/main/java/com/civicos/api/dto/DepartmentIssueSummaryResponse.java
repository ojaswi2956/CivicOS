package com.civicos.api.dto;

public class DepartmentIssueSummaryResponse {

    private Long departmentId;
    private String departmentName;
    private long reported;
    private long verified;
    private long assigned;
    private long inProgress;
    private long resolved;
    private long closed;
    private long totalIssues;

    public DepartmentIssueSummaryResponse(
            Long departmentId,
            String departmentName,
            long totalIssues,
            long reported,
            long verified,
            long assigned,
            long inProgress,
            long resolved,
            long closed
    ) {
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.totalIssues = totalIssues;
        this.reported = reported;
        this.verified = verified;
        this.assigned = assigned;
        this.inProgress = inProgress;
        this.resolved = resolved;
        this.closed = closed;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public String getDepartmentName() {
        return departmentName;
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

    public long getTotalIssues() {
        return totalIssues;
    }
}

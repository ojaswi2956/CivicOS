package com.civicos.api.dto;

public class CivicTrustScoreResponse {

    private Long departmentId;
    private String departmentName;
    private int trustScore;
    private String trustLevel;
    private int totalAssignedIssues;
    private int resolvedIssues;
    private int unresolvedIssues;
    private double resolutionRate;
    private double averageResolutionDays;
    private double statusHistoryCoverage;

    public CivicTrustScoreResponse() {
    }

    public CivicTrustScoreResponse(
            Long departmentId,
            String departmentName,
            int trustScore,
            String trustLevel,
            int totalAssignedIssues,
            int resolvedIssues,
            int unresolvedIssues,
            double resolutionRate,
            double averageResolutionDays,
            double statusHistoryCoverage
    ) {
        this.departmentId = departmentId;
        this.departmentName = departmentName;
        this.trustScore = trustScore;
        this.trustLevel = trustLevel;
        this.totalAssignedIssues = totalAssignedIssues;
        this.resolvedIssues = resolvedIssues;
        this.unresolvedIssues = unresolvedIssues;
        this.resolutionRate = resolutionRate;
        this.averageResolutionDays = averageResolutionDays;
        this.statusHistoryCoverage = statusHistoryCoverage;
    }

    public Long getDepartmentId() {
        return departmentId;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public int getTrustScore() {
        return trustScore;
    }

    public String getTrustLevel() {
        return trustLevel;
    }

    public int getTotalAssignedIssues() {
        return totalAssignedIssues;
    }

    public int getResolvedIssues() {
        return resolvedIssues;
    }

    public int getUnresolvedIssues() {
        return unresolvedIssues;
    }

    public double getResolutionRate() {
        return resolutionRate;
    }

    public double getAverageResolutionDays() {
        return averageResolutionDays;
    }

    public double getStatusHistoryCoverage() {
        return statusHistoryCoverage;
    }
}
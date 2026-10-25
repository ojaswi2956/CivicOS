
package com.civicos.api.dto;

import java.util.List;

public class CivicRiskResponse {

    private Long issueId;
    private String title;
    private int riskScore;
    private String riskLevel;
    private List<String> riskFactors;
    private int issueAgeDays;
    private int nearbyRelatedIssues;

    public CivicRiskResponse() {
    }

    public CivicRiskResponse(
            Long issueId,
            String title,
            int riskScore,
            String riskLevel,
            List<String> riskFactors,
            int issueAgeDays,
            int nearbyRelatedIssues
    ) {
        this.issueId = issueId;
        this.title = title;
        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.riskFactors = riskFactors;
        this.issueAgeDays = issueAgeDays;
        this.nearbyRelatedIssues = nearbyRelatedIssues;
    }

    public Long getIssueId() {
        return issueId;
    }

    public String getTitle() {
        return title;
    }

    public int getRiskScore() {
        return riskScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public List<String> getRiskFactors() {
        return riskFactors;
    }

    public int getIssueAgeDays() {
        return issueAgeDays;
    }

    public int getNearbyRelatedIssues() {
        return nearbyRelatedIssues;
    }
}


package com.civicos.api.dto;

public class RecurringIssueResponse {

    private Long issueId;
    private String title;
    private String category;
    private String status;
    private String createdAt;
    private Double distanceMeters;

    public RecurringIssueResponse(
            Long issueId,
            String title,
            String category,
            String status,
            String createdAt,
            Double distanceMeters
    ) {
        this.issueId = issueId;
        this.title = title;
        this.category = category;
        this.status = status;
        this.createdAt = createdAt;
        this.distanceMeters = distanceMeters;
    }

    public Long getIssueId() {
        return issueId;
    }

    public String getTitle() {
        return title;
    }

    public String getCategory() {
        return category;
    }

    public String getStatus() {
        return status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public Double getDistanceMeters() {
        return distanceMeters;
    }
}
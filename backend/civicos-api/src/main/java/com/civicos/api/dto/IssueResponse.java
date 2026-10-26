package com.civicos.api.dto;

public class IssueResponse {

    private Long id;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private Double latitude;
    private Double longitude;
    private Long reportedBy;
    private String createdAt;

    // Assignment information
    private Long assignedTo;
    private String assignedToName;

    // Evidence image
    private String imageUrl;

    private Integer citizenRating;
    private String citizenFeedback;
    private String feedbackSubmittedAt;
    private String reopenRequestStatus;
    private String reopenRequestMessage;
    private String reopenRequestedAt;

    public IssueResponse() {}

    public IssueResponse(
            Long id,
            String title,
            String description,
            String category,
            String priority,
            String status,
            Double latitude,
            Double longitude,
            Long reportedBy,
            String createdAt,
            Long assignedTo,
            String assignedToName,
            String imageUrl
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.priority = priority;
        this.status = status;
        this.latitude = latitude;
        this.longitude = longitude;
        this.reportedBy = reportedBy;
        this.createdAt = createdAt;
        this.assignedTo = assignedTo;
        this.assignedToName = assignedToName;
        this.imageUrl = imageUrl;
    }

    public void setCitizenFeedback(
            Integer citizenRating,
            String citizenFeedback,
            String feedbackSubmittedAt,
            String reopenRequestStatus,
            String reopenRequestMessage,
            String reopenRequestedAt
    ) {
        this.citizenRating = citizenRating;
        this.citizenFeedback = citizenFeedback;
        this.feedbackSubmittedAt = feedbackSubmittedAt;
        this.reopenRequestStatus = reopenRequestStatus;
        this.reopenRequestMessage = reopenRequestMessage;
        this.reopenRequestedAt = reopenRequestedAt;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getCategory() {
        return category;
    }

    public String getPriority() {
        return priority;
    }

    public String getStatus() {
        return status;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public Long getReportedBy() {
        return reportedBy;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public Long getAssignedTo() {
        return assignedTo;
    }

    public String getAssignedToName() {
        return assignedToName;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public Integer getCitizenRating() {
        return citizenRating;
    }

    public String getCitizenFeedback() {
        return citizenFeedback;
    }

    public String getFeedbackSubmittedAt() {
        return feedbackSubmittedAt;
    }

    public String getReopenRequestStatus() {
        return reopenRequestStatus;
    }

    public String getReopenRequestMessage() {
        return reopenRequestMessage;
    }

    public String getReopenRequestedAt() {
        return reopenRequestedAt;
    }
}
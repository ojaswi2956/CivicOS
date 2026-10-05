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
}
package com.civicos.api.dto;

import java.time.LocalDateTime;

import com.civicos.api.entity.IssueCategory;
import com.civicos.api.entity.IssueStatus;

public class IssueMapPointResponse {

    private final Long id;
    private final String title;
    private final IssueCategory category;
    private final IssueStatus status;
    private final Double latitude;
    private final Double longitude;
    private final LocalDateTime createdAt;

    public IssueMapPointResponse(
            Long id,
            String title,
            IssueCategory category,
            IssueStatus status,
            Double latitude,
            Double longitude,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.status = status;
        this.latitude = latitude;
        this.longitude = longitude;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public IssueCategory getCategory() {
        return category;
    }

    public IssueStatus getStatus() {
        return status;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

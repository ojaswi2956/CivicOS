package com.civicos.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SubmitIssueFeedbackRequest {

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating cannot exceed 5")
    private Integer rating;

    @Size(max = 2000, message = "Feedback cannot exceed 2000 characters")
    private String comment;

    private boolean requestReopen;

    @Size(max = 1000, message = "Reopen request note cannot exceed 1000 characters")
    private String reopenRequestMessage;

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public boolean isRequestReopen() {
        return requestReopen;
    }

    public void setRequestReopen(boolean requestReopen) {
        this.requestReopen = requestReopen;
    }

    public String getReopenRequestMessage() {
        return reopenRequestMessage;
    }

    public void setReopenRequestMessage(String reopenRequestMessage) {
        this.reopenRequestMessage = reopenRequestMessage;
    }
}

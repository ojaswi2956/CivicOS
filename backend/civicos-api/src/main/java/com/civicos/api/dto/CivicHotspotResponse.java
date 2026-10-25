
package com.civicos.api.dto;

public class CivicHotspotResponse {

    private Double latitude;
    private Double longitude;
    private int totalReports;
    private String dominantCategory;
    private int recentReports;
    private int hotspotScore;
    private String severity;

    public CivicHotspotResponse() {
    }

    public CivicHotspotResponse(
            Double latitude,
            Double longitude,
            int totalReports,
            String dominantCategory,
            int recentReports,
            int hotspotScore,
            String severity
    ) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.totalReports = totalReports;
        this.dominantCategory = dominantCategory;
        this.recentReports = recentReports;
        this.hotspotScore = hotspotScore;
        this.severity = severity;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public int getTotalReports() {
        return totalReports;
    }

    public String getDominantCategory() {
        return dominantCategory;
    }

    public int getRecentReports() {
        return recentReports;
    }

    public int getHotspotScore() {
        return hotspotScore;
    }

    public String getSeverity() {
        return severity;
    }
}


package com.civicos.api.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.civicos.api.dto.CivicHotspotResponse;
import com.civicos.api.entity.Issue;
import com.civicos.api.entity.Role;
import com.civicos.api.entity.User;
import com.civicos.api.exception.ForbiddenException;
import com.civicos.api.exception.ResourceNotFoundException;
import com.civicos.api.repository.IssueRepository;
import com.civicos.api.repository.UserRepository;

@Service
public class CivicHotspotService {

    private static final double CLUSTER_RADIUS_METERS = 500.0;
    private static final int RECENT_DAYS = 30;

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;

    public CivicHotspotService(
            IssueRepository issueRepository,
            UserRepository userRepository
    ) {
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CivicHotspotResponse> getHotspots() {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.ADMIN
                && currentUser.getRole() != Role.DEPARTMENT) {
            throw new ForbiddenException(
                    "Only admins and department users can view civic hotspots"
            );
        }

        List<Issue> issues = issueRepository.findAll()
                .stream()
                .filter(issue -> issue.getLatitude() != null)
                .filter(issue -> issue.getLongitude() != null)
                .toList();

        if (currentUser.getRole() == Role.DEPARTMENT) {
            issues = issues.stream()
                    .filter(issue -> issue.getAssignedTo() != null)
                    .filter(issue ->
                            issue.getAssignedTo().getId()
                                    .equals(currentUser.getId()))
                    .toList();
        }

        List<Cluster> clusters = new ArrayList<>();

        for (Issue issue : issues) {
            Cluster matchingCluster = null;

            for (Cluster cluster : clusters) {
                double distance = distanceMeters(
                        cluster.latitude,
                        cluster.longitude,
                        issue.getLatitude(),
                        issue.getLongitude()
                );

                if (distance <= CLUSTER_RADIUS_METERS) {
                    matchingCluster = cluster;
                    break;
                }
            }

            if (matchingCluster == null) {
                matchingCluster = new Cluster(
                        issue.getLatitude(),
                        issue.getLongitude()
                );
                clusters.add(matchingCluster);
            }

            matchingCluster.add(issue);
        }

        LocalDateTime recentCutoff =
                LocalDateTime.now().minusDays(RECENT_DAYS);

        List<CivicHotspotResponse> responses = new ArrayList<>();

        for (Cluster cluster : clusters) {
            if (cluster.issues.size() < 2) {
                continue;
            }

            int recentReports = (int) cluster.issues.stream()
                    .filter(issue ->
                            issue.getCreatedAt() != null
                                    && !issue.getCreatedAt()
                                            .isBefore(recentCutoff))
                    .count();

            Map<String, Integer> categoryCounts = new HashMap<>();

            for (Issue issue : cluster.issues) {
                String category = issue.getCategory().name();

                categoryCounts.merge(category, 1, Integer::sum);
            }

            String dominantCategory = categoryCounts.entrySet()
                    .stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("OTHER");

            int totalReports = cluster.issues.size();

            int volumePoints = Math.min(60, totalReports * 10);
            int recurrencePoints = Math.min(40, recentReports * 5);

            int hotspotScore = Math.min(
                    100,
                    volumePoints + recurrencePoints
            );

            String severity;

            if (hotspotScore >= 80) {
                severity = "CRITICAL";
            } else if (hotspotScore >= 60) {
                severity = "HIGH";
            } else if (hotspotScore >= 30) {
                severity = "MODERATE";
            } else {
                severity = "LOW";
            }

            responses.add(
                    new CivicHotspotResponse(
                            cluster.latitude,
                            cluster.longitude,
                            totalReports,
                            dominantCategory,
                            recentReports,
                            hotspotScore,
                            severity
                    )
            );
        }

        responses.sort(
                Comparator.comparingInt(
                        CivicHotspotResponse::getHotspotScore
                ).reversed()
        );

        return responses;
    }

    private double distanceMeters(
            double lat1,
            double lon1,
            double lat2,
            double lon2
    ) {
        double earthRadius = 6_371_000.0;

        double latitudeDifference =
                Math.toRadians(lat2 - lat1);

        double longitudeDifference =
                Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(latitudeDifference / 2)
                        * Math.sin(latitudeDifference / 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(longitudeDifference / 2)
                        * Math.sin(longitudeDifference / 2);

        double c = 2 * Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
        );

        return earthRadius * c;
    }

    private User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {
            throw new ForbiddenException("User is not authenticated");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Authenticated user not found"
                        )
                );
    }

    private static class Cluster {

        private double latitude;
        private double longitude;
        private final List<Issue> issues = new ArrayList<>();
        private final Set<Long> issueIds = new HashSet<>();

        private Cluster(double latitude, double longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
        }

        private void add(Issue issue) {
            if (issue.getId() != null
                    && !issueIds.add(issue.getId())) {
                return;
            }

            issues.add(issue);

            double latitudeSum = 0.0;
            double longitudeSum = 0.0;

            for (Issue item : issues) {
                latitudeSum += item.getLatitude();
                longitudeSum += item.getLongitude();
            }

            latitude = latitudeSum / issues.size();
            longitude = longitudeSum / issues.size();
        }
    }
}

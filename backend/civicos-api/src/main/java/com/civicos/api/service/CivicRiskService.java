
package com.civicos.api.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.civicos.api.dto.CivicRiskResponse;
import com.civicos.api.entity.Issue;
import com.civicos.api.entity.IssuePriority;
import com.civicos.api.entity.IssueStatus;
import com.civicos.api.entity.Role;
import com.civicos.api.entity.User;
import com.civicos.api.exception.ForbiddenException;
import com.civicos.api.exception.ResourceNotFoundException;
import com.civicos.api.repository.IssueRepository;
import com.civicos.api.repository.UserRepository;

@Service
public class CivicRiskService {

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;

    public CivicRiskService(
            IssueRepository issueRepository,
            UserRepository userRepository
    ) {
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public CivicRiskResponse assessIssue(Long issueId) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.ADMIN
                && currentUser.getRole() != Role.DEPARTMENT) {
            throw new ForbiddenException(
                    "Only admins and department users can view risk assessments"
            );
        }

        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Issue not found")
                );

        if (currentUser.getRole() == Role.DEPARTMENT) {
            if (issue.getAssignedTo() == null
                    || !issue.getAssignedTo().getId()
                            .equals(currentUser.getId())) {
                throw new ForbiddenException(
                        "You can only assess issues assigned to you"
                );
            }
        }

        return calculateRisk(issue);
    }

    @Transactional(readOnly = true)
    public List<CivicRiskResponse> assessAllIssues() {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.ADMIN
                && currentUser.getRole() != Role.DEPARTMENT) {
            throw new ForbiddenException(
                    "Only admins and department users can view risk assessments"
            );
        }

        List<Issue> issues;

        if (currentUser.getRole() == Role.ADMIN) {
            issues = issueRepository.findAll();
        } else {
            issues = issueRepository.findByAssignedTo(currentUser);
        }

        return issues.stream()
                .map(this::calculateRisk)
                .sorted((a, b) ->
                        Integer.compare(b.getRiskScore(), a.getRiskScore()))
                .toList();
    }

    private CivicRiskResponse calculateRisk(Issue issue) {

        int score = 0;
        List<String> factors = new ArrayList<>();

        // 1. Priority: maximum 30 points
        int priorityScore = switch (issue.getPriority()) {
            case LOW -> 5;
            case MEDIUM -> 12;
            case HIGH -> 22;
            case CRITICAL -> 30;
        };

        score += priorityScore;

        if (priorityScore >= 22) {
            factors.add("High issue priority: " + issue.getPriority().name());
        } else {
            factors.add("Issue priority: " + issue.getPriority().name());
        }

        // Resolved issues should not accumulate urgency due to age.
        boolean unresolved =
                issue.getStatus() != IssueStatus.RESOLVED
                && issue.getStatus() != IssueStatus.CLOSED;

        long ageDays = Math.max(
                0,
                ChronoUnit.DAYS.between(
                        issue.getCreatedAt(),
                        LocalDateTime.now()
                )
        );

        int ageScore = 0;

        if (unresolved) {
            if (ageDays >= 14) {
                ageScore = 25;
            } else if (ageDays >= 7) {
                ageScore = 18;
            } else if (ageDays >= 3) {
                ageScore = 10;
            } else if (ageDays >= 1) {
                ageScore = 5;
            }
        }

        score += ageScore;

        if (ageScore > 0) {
            factors.add("Unresolved for " + ageDays + " days");
        }

        // 3. Nearby recurring reports: maximum 25 points
        List<Issue> nearbyIssues =
                issueRepository.findNearbyIssues(
                        issue.getId(),
                        issue.getCategory().name(),
                        issue.getLatitude(),
                        issue.getLongitude(),
                        500.0
                );

        int nearbyCount = nearbyIssues.size();
        int recurrenceScore = 0;

        if (unresolved) {
            if (nearbyCount >= 5) {
                recurrenceScore = 25;
            } else if (nearbyCount >= 3) {
                recurrenceScore = 18;
            } else if (nearbyCount >= 1) {
                recurrenceScore = 10;
            }
        }

        score += recurrenceScore;

        if (nearbyCount > 0) {
            factors.add(
                    nearbyCount + " related issue(s) found within 500 metres"
            );
        }

        // 4. Severity/category proxy: maximum 20 points.
        // Priority already has its own component, so this component
        // uses category as a conservative proxy rather than claiming
        // to measure actual public harm.
        int severityScore = switch (issue.getCategory().name()) {
            case "ROADS", "ELECTRICITY", "WATER_SUPPLY", "DRAINAGE" -> 15;
            default -> 8;
        };

        score += severityScore;
        factors.add(
                "Category impact factor: " + issue.getCategory().name()
        );

        // Keep the score within the documented 0-100 range.
        score = Math.min(100, score);

        String riskLevel;

        if (score >= 80) {
            riskLevel = "CRITICAL";
        } else if (score >= 60) {
            riskLevel = "HIGH";
        } else if (score >= 30) {
            riskLevel = "MODERATE";
        } else {
            riskLevel = "LOW";
        }

        if (!unresolved) {
            factors.add("Issue is " + issue.getStatus().name());
        }

        return new CivicRiskResponse(
                issue.getId(),
                issue.getTitle(),
                score,
                riskLevel,
                factors,
                (int) Math.min(ageDays, Integer.MAX_VALUE),
                nearbyCount
        );
    }

    private User getCurrentUser() {

        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder
                        .getContext()
                        .getAuthentication();

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
}

package com.civicos.api.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.civicos.api.dto.CivicTrustScoreResponse;
import com.civicos.api.entity.Issue;
import com.civicos.api.entity.IssueStatus;
import com.civicos.api.entity.Role;
import com.civicos.api.entity.User;
import com.civicos.api.exception.ForbiddenException;
import com.civicos.api.exception.ResourceNotFoundException;
import com.civicos.api.repository.IssueRepository;
import com.civicos.api.repository.IssueStatusHistoryRepository;
import com.civicos.api.repository.UserRepository;

@Service
public class CivicTrustScoreService {

    private final IssueRepository issueRepository;
    private final IssueStatusHistoryRepository historyRepository;
    private final UserRepository userRepository;

    public CivicTrustScoreService(
            IssueRepository issueRepository,
            IssueStatusHistoryRepository historyRepository,
            UserRepository userRepository
    ) {
        this.issueRepository = issueRepository;
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public CivicTrustScoreResponse getMyDepartmentScore() {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.DEPARTMENT) {
            throw new ForbiddenException(
                    "Only department users can view their department trust score"
            );
        }

        List<Issue> issues =
                issueRepository.findByAssignedTo(currentUser);

        return calculateScore(currentUser, issues);
    }

    @Transactional(readOnly = true)
    public List<CivicTrustScoreResponse> getAllDepartmentScores() {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException(
                    "Only admins can view all department trust scores"
            );
        }

        List<User> departments = userRepository.findAll()
                .stream()
                .filter(user -> user.getRole() == Role.DEPARTMENT)
                .toList();

        List<CivicTrustScoreResponse> responses = new ArrayList<>();

        for (User department : departments) {
            List<Issue> issues =
                    issueRepository.findByAssignedTo(department);

            responses.add(calculateScore(department, issues));
        }

        responses.sort(
                (a, b) -> Integer.compare(
                        b.getTrustScore(),
                        a.getTrustScore()
                )
        );

        return responses;
    }

    private CivicTrustScoreResponse calculateScore(
            User department,
            List<Issue> issues
    ) {
        int total = issues.size();

        int resolved = (int) issues.stream()
                .filter(this::isResolved)
                .count();

        int unresolved = total - resolved;

        double resolutionRate = total == 0
                ? 0.0
                : (resolved * 100.0) / total;

        int resolutionPoints = total == 0
                ? 0
                : (int) Math.round(resolutionRate * 0.40);

        // Resolution speed: average time from issue creation to
        // the first RESOLVED or CLOSED status-history entry.
        List<Long> resolutionDurations = new ArrayList<>();

        int issuesWithHistory = 0;

        for (Issue issue : issues) {
            var history =
                    historyRepository.findByIssueOrderByChangedAtAsc(issue);

            if (!history.isEmpty()) {
                issuesWithHistory++;
            }

            if (isResolved(issue)) {
                history.stream()
                        .filter(entry ->
                                entry.getStatus() == IssueStatus.RESOLVED
                                || entry.getStatus() == IssueStatus.CLOSED
                        )
                        .map(entry -> ChronoUnit.DAYS.between(
                                issue.getCreatedAt(),
                                entry.getChangedAt()
                        ))
                        .filter(days -> days >= 0)
                        .findFirst()
                        .ifPresent(resolutionDurations::add);
            }
        }

        double averageResolutionDays = resolutionDurations.isEmpty()
                ? 0.0
                : resolutionDurations.stream()
                        .mapToLong(Long::longValue)
                        .average()
                        .orElse(0.0);

        int speedPoints = 0;

        if (!resolutionDurations.isEmpty()) {
            if (averageResolutionDays <= 2) {
                speedPoints = 25;
            } else if (averageResolutionDays <= 5) {
                speedPoints = 20;
            } else if (averageResolutionDays <= 10) {
                speedPoints = 15;
            } else if (averageResolutionDays <= 20) {
                speedPoints = 10;
            } else {
                speedPoints = 5;
            }
        }

        // Backlog management: a lower unresolved proportion
        // earns more points.
        double unresolvedRate = total == 0
                ? 100.0
                : (unresolved * 100.0) / total;

        int backlogPoints = total == 0
                ? 0
                : (int) Math.round(
                        (100.0 - unresolvedRate) * 0.20
                );

        // Status transparency: proportion of assigned issues
        // with at least one status-history entry.
        double historyCoverage = total == 0
                ? 0.0
                : (issuesWithHistory * 100.0) / total;

        int transparencyPoints = total == 0
                ? 0
                : (int) Math.round(historyCoverage * 0.15);

        int score = Math.min(
                100,
                resolutionPoints
                        + speedPoints
                        + backlogPoints
                        + transparencyPoints
        );

        String trustLevel;

        if (total == 0) {
            trustLevel = "INSUFFICIENT_DATA";
            score = 0;
        } else if (score >= 80) {
            trustLevel = "HIGH";
        } else if (score >= 60) {
            trustLevel = "GOOD";
        } else if (score >= 40) {
            trustLevel = "MODERATE";
        } else {
            trustLevel = "NEEDS_IMPROVEMENT";
        }

        return new CivicTrustScoreResponse(
                department.getId(),
                department.getName(),
                score,
                trustLevel,
                total,
                resolved,
                unresolved,
                roundToTwoDecimals(resolutionRate),
                roundToTwoDecimals(averageResolutionDays),
                roundToTwoDecimals(historyCoverage)
        );
    }

    private boolean isResolved(Issue issue) {
        return issue.getStatus() == IssueStatus.RESOLVED
                || issue.getStatus() == IssueStatus.CLOSED;
    }

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
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
}
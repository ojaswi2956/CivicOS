package com.civicos.api.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.civicos.api.dto.AssignIssueRequest;
import com.civicos.api.dto.CreateIssueRequest;
import com.civicos.api.dto.DashboardStatsResponse;
import com.civicos.api.dto.DepartmentStatsResponse;
import com.civicos.api.dto.IssueResponse;
import com.civicos.api.dto.IssueStatusHistoryResponse;
import com.civicos.api.dto.RecurringIssueResponse;
import com.civicos.api.dto.UpdateIssueStatusRequest;
import com.civicos.api.entity.Issue;
import com.civicos.api.entity.IssueCategory;
import com.civicos.api.entity.IssuePriority;
import com.civicos.api.entity.IssueStatus;
import com.civicos.api.entity.IssueStatusHistory;
import com.civicos.api.entity.Role;
import com.civicos.api.entity.User;
import com.civicos.api.exception.BadRequestException;
import com.civicos.api.exception.ForbiddenException;
import com.civicos.api.exception.ResourceNotFoundException;
import com.civicos.api.repository.IssueRepository;
import com.civicos.api.repository.IssueStatusHistoryRepository;
import com.civicos.api.repository.UserRepository;

@Service
public class IssueService {

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final IssueStatusHistoryRepository issueStatusHistoryRepository;
    private final IssueStatusTransitionService issueStatusTransitionService;

    /*
     * Folder where issue evidence images will be stored.
     *
     * uploads/
     *     issues/
     *
     * The folder is created relative to the backend
     * application's working directory.
     */
    private static final String UPLOAD_DIRECTORY =
            "uploads/issues";

    /*
     * Maximum allowed image size:
     *
     * 5 MB
     */
    private static final long MAX_IMAGE_SIZE =
            5 * 1024 * 1024;

    public IssueService(
            IssueRepository issueRepository,
            UserRepository userRepository,
            IssueStatusHistoryRepository issueStatusHistoryRepository,
            IssueStatusTransitionService issueStatusTransitionService
    ) {
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.issueStatusHistoryRepository =
                issueStatusHistoryRepository;
        this.issueStatusTransitionService =
                issueStatusTransitionService;
    }

    // =========================================================
    // CREATE ISSUE
    // =========================================================

    public IssueResponse createIssue(
            CreateIssueRequest request,
            MultipartFile image
    ) {

        User currentUser = getCurrentUser();

        Issue issue = new Issue();

        issue.setTitle(request.getTitle());
        issue.setDescription(request.getDescription());
        issue.setCategory(request.getCategory());
        issue.setPriority(request.getPriority());

        issue.setLatitude(request.getLatitude());
        issue.setLongitude(request.getLongitude());

        issue.setStatus(IssueStatus.REPORTED);
        issue.setReportedBy(currentUser);

        /*
         * Save image if the citizen uploaded one.
         */
        if (image != null && !image.isEmpty()) {

            String imageUrl =
                    saveIssueImage(image);

            issue.setImageUrl(imageUrl);
        }

        issue.setCreatedAt(LocalDateTime.now());
        issue.setUpdatedAt(LocalDateTime.now());

        Issue savedIssue =
                issueRepository.save(issue);

        /*
         * Create initial status history entry.
         */
        IssueStatusHistory history =
                new IssueStatusHistory();

        history.setIssue(savedIssue);
        history.setStatus(IssueStatus.REPORTED);
        history.setChangedAt(LocalDateTime.now());
        history.setChangedBy(currentUser);

        issueStatusHistoryRepository.save(history);

        return mapToResponse(savedIssue);
    }

    // =========================================================
    // SAVE ISSUE IMAGE
    // =========================================================

    private String saveIssueImage(
            MultipartFile image
    ) {

        /*
         * Validate file size.
         */
        if (image.getSize() > MAX_IMAGE_SIZE) {

            throw new BadRequestException(
                    "Image size cannot exceed 5 MB"
            );
        }

        /*
         * Validate MIME type.
         */
        String contentType =
                image.getContentType();

        if (contentType == null) {

            throw new BadRequestException(
                    "Unable to determine image type"
            );
        }

        if (!contentType.equals("image/jpeg")
                && !contentType.equals("image/png")
                && !contentType.equals("image/webp")) {

            throw new BadRequestException(
                    "Only JPEG, PNG and WEBP images are allowed"
            );
        }

        /*
         * Determine safe file extension.
         */
        String extension;

        switch (contentType) {

            case "image/jpeg":
                extension = ".jpg";
                break;

            case "image/png":
                extension = ".png";
                break;

            case "image/webp":
                extension = ".webp";
                break;

            default:
                throw new BadRequestException(
                        "Unsupported image type"
                );
        }

        /*
         * Generate unique filename.
         *
         * Example:
         *
         * 8e7b2c14-6c7f-4a6f-9e45-8e9c8f1d4c21.jpg
         */
        String fileName =
                UUID.randomUUID().toString()
                        + extension;

        /*
         * Create upload directory if it doesn't exist.
         */
        Path uploadDirectory =
                Paths.get(UPLOAD_DIRECTORY)
                        .toAbsolutePath()
                        .normalize();

        try {

            Files.createDirectories(
                    uploadDirectory
            );

        } catch (IOException exception) {

            throw new RuntimeException(
                    "Unable to create image upload directory",
                    exception
            );
        }

        /*
         * Resolve the final file path.
         */
        Path targetPath =
                uploadDirectory
                        .resolve(fileName)
                        .normalize();

        /*
         * Safety check to prevent path traversal.
         */
        if (!targetPath.startsWith(uploadDirectory)) {

            throw new BadRequestException(
                    "Invalid image file name"
            );
        }

        /*
         * Save the uploaded file.
         */
        try (InputStream inputStream =
                     image.getInputStream()) {

            Files.copy(
                    inputStream,
                    targetPath,
                    StandardCopyOption.REPLACE_EXISTING
            );

        } catch (IOException exception) {

            throw new RuntimeException(
                    "Unable to save issue image",
                    exception
            );
        }

        /*
         * Store only the URL/path in PostgreSQL.
         *
         * The actual image stays on the server filesystem.
         */
        return "/uploads/issues/" + fileName;
    }

    // =========================================================
    // CITIZEN - MY ISSUES
    // =========================================================

    public List<IssueResponse> getMyIssues() {

        User currentUser = getCurrentUser();

        List<Issue> issues =
                issueRepository.findByReportedBy(currentUser);

        return issues.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // =========================================================
    // GET ALL ISSUES
    // =========================================================

    public List<IssueResponse> getAllIssues() {

        List<Issue> issues =
                issueRepository.findAll();

        return issues.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // =========================================================
    // SEARCH + FILTER + PAGINATION
    // =========================================================

    public Page<IssueResponse> filterIssues(
            String keyword,
            IssueStatus status,
            IssuePriority priority,
            IssueCategory category,
            Pageable pageable
    ) {

        String searchKeyword =
                keyword != null
                        ? keyword.trim()
                        : "";

        if (searchKeyword.isEmpty()) {
            searchKeyword = null;
        }

        Page<Issue> issues =
                issueRepository.searchAndFilter(
                        searchKeyword,
                        status,
                        priority,
                        category,
                        pageable
                );

        return issues.map(this::mapToResponse);
    }

    // =========================================================
    // ADMIN DASHBOARD STATISTICS
    // =========================================================

    public DashboardStatsResponse getDashboardStats() {

        long totalIssues =
                issueRepository.count();

        long reported =
                issueRepository.countByStatus(
                        IssueStatus.REPORTED
                );

        long verified =
                issueRepository.countByStatus(
                        IssueStatus.VERIFIED
                );

        long assigned =
                issueRepository.countByStatus(
                        IssueStatus.ASSIGNED
                );

        long inProgress =
                issueRepository.countByStatus(
                        IssueStatus.IN_PROGRESS
                );

        long resolved =
                issueRepository.countByStatus(
                        IssueStatus.RESOLVED
                );

        long closed =
                issueRepository.countByStatus(
                        IssueStatus.CLOSED
                );

        long lowPriority =
                issueRepository.countByPriority(
                        IssuePriority.LOW
                );

        long mediumPriority =
                issueRepository.countByPriority(
                        IssuePriority.MEDIUM
                );

        long highPriority =
                issueRepository.countByPriority(
                        IssuePriority.HIGH
                );

        long criticalPriority =
                issueRepository.countByPriority(
                        IssuePriority.CRITICAL
                );

        return new DashboardStatsResponse(
                totalIssues,
                reported,
                verified,
                assigned,
                inProgress,
                resolved,
                closed,
                lowPriority,
                mediumPriority,
                highPriority,
                criticalPriority
        );
    }

    // =========================================================
    // DEPARTMENT - ASSIGNED ISSUES
    // =========================================================

    public List<IssueResponse> getAssignedIssues() {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.DEPARTMENT) {

            throw new ForbiddenException(
                    "Only department users can view assigned issues"
            );
        }

        List<Issue> issues =
                issueRepository.findByAssignedTo(
                        currentUser
                );

        return issues.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // =========================================================
    // DEPARTMENT DASHBOARD STATISTICS
    // =========================================================

    public DepartmentStatsResponse getDepartmentStats() {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.DEPARTMENT) {

            throw new ForbiddenException(
                    "Only department users can view department statistics"
            );
        }

        long totalAssigned =
                issueRepository.countByAssignedTo(
                        currentUser
                );

        long assigned =
                issueRepository.countByAssignedToAndStatus(
                        currentUser,
                        IssueStatus.ASSIGNED
                );

        long inProgress =
                issueRepository.countByAssignedToAndStatus(
                        currentUser,
                        IssueStatus.IN_PROGRESS
                );

        long resolved =
                issueRepository.countByAssignedToAndStatus(
                        currentUser,
                        IssueStatus.RESOLVED
                );

        return new DepartmentStatsResponse(
                totalAssigned,
                assigned,
                inProgress,
                resolved
        );
    }

    // =========================================================
    // GET ISSUE BY ID
    // =========================================================

    public IssueResponse getIssueById(Long id) {

        User currentUser = getCurrentUser();

        Issue issue =
                issueRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Issue not found"
                                )
                        );

        if (currentUser.getRole() == Role.CITIZEN) {

            if (!issue.getReportedBy()
                    .getId()
                    .equals(currentUser.getId())) {

                throw new ForbiddenException(
                        "You are not allowed to view this issue"
                );
            }
        }

        if (currentUser.getRole() == Role.DEPARTMENT) {

            if (issue.getAssignedTo() == null
                    || !issue.getAssignedTo()
                            .getId()
                            .equals(currentUser.getId())) {

                throw new ForbiddenException(
                        "You are not allowed to view this issue"
                );
            }
        }

        return mapToResponse(issue);
    }

    // =========================================================
    // ISSUE STATUS HISTORY
    // =========================================================

    public List<IssueStatusHistoryResponse> getIssueHistory(
            Long issueId
    ) {

        User currentUser = getCurrentUser();

        Issue issue =
                issueRepository.findById(issueId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Issue not found"
                                )
                        );

        if (currentUser.getRole() == Role.CITIZEN) {

            if (!issue.getReportedBy()
                    .getId()
                    .equals(currentUser.getId())) {

                throw new ForbiddenException(
                        "You are not allowed to view this history"
                );
            }
        }

        if (currentUser.getRole() == Role.DEPARTMENT) {

            if (issue.getAssignedTo() == null
                    || !issue.getAssignedTo()
                            .getId()
                            .equals(currentUser.getId())) {

                throw new ForbiddenException(
                        "You are not allowed to view this history"
                );
            }
        }

        List<IssueStatusHistory> history =
                issueStatusHistoryRepository
                        .findByIssueOrderByChangedAtAsc(
                                issue
                        );

        return history.stream()
                .map(item ->
                        new IssueStatusHistoryResponse(
                                item.getStatus().name(),
                                item.getChangedAt().toString(),
                                item.getChangedBy() != null
                                        ? item.getChangedBy().getId()
                                        : null
                        )
                )
                .collect(Collectors.toList());
    }

    // =========================================================
    // UPDATE ISSUE STATUS
    // =========================================================

    public IssueResponse updateIssueStatus(
            Long issueId,
            UpdateIssueStatusRequest request
    ) {

        User currentUser = getCurrentUser();

        Issue issue =
                issueRepository.findById(issueId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Issue not found"
                                )
                        );

        IssueStatus currentStatus =
                issue.getStatus();

        IssueStatus newStatus =
                request.getStatus();

        // -----------------------------------------------------
        // VALIDATE WORKFLOW
        // -----------------------------------------------------

        issueStatusTransitionService.validateTransition(
                currentUser.getRole(),
                currentStatus,
                newStatus
        );

        // -----------------------------------------------------
        // UPDATE ISSUE
        // -----------------------------------------------------

        issue.setStatus(newStatus);
        issue.setUpdatedAt(LocalDateTime.now());

        Issue savedIssue =
                issueRepository.save(issue);

        // -----------------------------------------------------
        // CREATE STATUS HISTORY
        // -----------------------------------------------------

        IssueStatusHistory history =
                new IssueStatusHistory();

        history.setIssue(savedIssue);
        history.setStatus(newStatus);
        history.setChangedAt(LocalDateTime.now());
        history.setChangedBy(currentUser);

        issueStatusHistoryRepository.save(history);

        return mapToResponse(savedIssue);
    }

    // =========================================================
    // ASSIGN ISSUE
    // =========================================================

    public IssueResponse assignIssue(
            Long issueId,
            AssignIssueRequest request
    ) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.ADMIN) {

            throw new ForbiddenException(
                    "Only admins can assign issues"
            );
        }

        Issue issue =
                issueRepository.findById(issueId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Issue not found"
                                )
                        );

        User departmentUser =
                userRepository.findById(
                        request.getAssignedTo()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Assigned user not found"
                        )
                );

        if (departmentUser.getRole() != Role.DEPARTMENT) {

            throw new BadRequestException(
                    "Issue can only be assigned to a department user"
            );
        }

        if (issue.getStatus() != IssueStatus.VERIFIED) {

            throw new BadRequestException(
                    "Only verified issues can be assigned"
            );
        }

        issue.setAssignedTo(departmentUser);
        issue.setStatus(IssueStatus.ASSIGNED);
        issue.setUpdatedAt(LocalDateTime.now());

        Issue savedIssue =
                issueRepository.save(issue);

        IssueStatusHistory history =
                new IssueStatusHistory();

        history.setIssue(savedIssue);
        history.setStatus(IssueStatus.ASSIGNED);
        history.setChangedAt(LocalDateTime.now());
        history.setChangedBy(currentUser);

        issueStatusHistoryRepository.save(history);

        return mapToResponse(savedIssue);
    }

    // =========================================================
    // CIVIC MEMORY - FIND POTENTIALLY RECURRING ISSUES
    // =========================================================

    public List<RecurringIssueResponse> findRecurringIssues(
            Long issueId
    ) {

        User currentUser = getCurrentUser();

        if (currentUser.getRole() != Role.ADMIN
                && currentUser.getRole() != Role.DEPARTMENT) {

            throw new ForbiddenException(
                    "Only admins and department users can review recurring issues"
            );
        }

        Issue issue =
                issueRepository.findById(issueId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Issue not found"
                                )
                        );

        if (currentUser.getRole() == Role.DEPARTMENT) {

            if (issue.getAssignedTo() == null
                    || !issue.getAssignedTo()
                            .getId()
                            .equals(currentUser.getId())) {

                throw new ForbiddenException(
                        "You can only review recurrence for issues assigned to you"
                );
            }
        }

        List<Issue> nearbyIssues =
                issueRepository.findNearbyIssues(
                        issue.getId(),
                        issue.getCategory().name(),
                        issue.getLatitude(),
                        issue.getLongitude(),
                        500.0
                );

        return nearbyIssues.stream()
                .map(nearby ->
                        new RecurringIssueResponse(
                                nearby.getId(),
                                nearby.getTitle(),
                                nearby.getCategory().name(),
                                nearby.getStatus().name(),
                                nearby.getCreatedAt().toString(),
                                calculateDistanceMeters(
                                        issue.getLatitude(),
                                        issue.getLongitude(),
                                        nearby.getLatitude(),
                                        nearby.getLongitude()
                                )
                        )
                )
                .collect(Collectors.toList());
    }

    // =========================================================
    // CALCULATE DISTANCE BETWEEN TWO LOCATIONS
    // =========================================================

    private double calculateDistanceMeters(
            double latitude1,
            double longitude1,
            double latitude2,
            double longitude2
    ) {

        final double earthRadiusMeters =
                6371000.0;

        double latDistance =
                Math.toRadians(
                        latitude2 - latitude1
                );

        double lonDistance =
                Math.toRadians(
                        longitude2 - longitude1
                );

        double a =
                Math.sin(latDistance / 2)
                        * Math.sin(latDistance / 2)
                        + Math.cos(
                                Math.toRadians(latitude1)
                        )
                        * Math.cos(
                                Math.toRadians(latitude2)
                        )
                        * Math.sin(lonDistance / 2)
                        * Math.sin(lonDistance / 2);

        double c =
                2 * Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                );

        return earthRadiusMeters * c;
    }

    // =========================================================
    // CURRENT USER
    // =========================================================

    private User getCurrentUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new RuntimeException(
                    "User is not authenticated"
            );
        }

        String email =
                authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Authenticated user not found"
                        )
                );
    }

    // =========================================================
    // MAP ENTITY TO RESPONSE
    // =========================================================

    private IssueResponse mapToResponse(
            Issue issue
    ) {

        Long assignedToId = null;
        String assignedToName = null;

        if (issue.getAssignedTo() != null) {

            assignedToId =
                    issue.getAssignedTo().getId();

            assignedToName =
                    issue.getAssignedTo().getName();
        }

        return new IssueResponse(
                issue.getId(),
                issue.getTitle(),
                issue.getDescription(),
                issue.getCategory().name(),
                issue.getPriority().name(),
                issue.getStatus().name(),
                issue.getLatitude(),
                issue.getLongitude(),
                issue.getReportedBy().getId(),
                issue.getCreatedAt().toString(),
                assignedToId,
                assignedToName,
                issue.getImageUrl()
        );
    }
}
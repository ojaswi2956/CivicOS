package com.civicos.api.controller;

import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.civicos.api.dto.AssignIssueRequest;
import com.civicos.api.dto.CreateIssueRequest;
import com.civicos.api.dto.DashboardStatsResponse;
import com.civicos.api.dto.DepartmentStatsResponse;
import com.civicos.api.dto.IssueResponse;
import com.civicos.api.dto.IssueStatusHistoryResponse;
import com.civicos.api.dto.RecurringIssueResponse;
import com.civicos.api.dto.UpdateIssueStatusRequest;
import com.civicos.api.entity.IssueCategory;
import com.civicos.api.entity.IssuePriority;
import com.civicos.api.entity.IssueStatus;
import com.civicos.api.service.IssueService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private static final int MAX_PAGE_SIZE = 50;

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "createdAt",
            "updatedAt",
            "priority",
            "status",
            "title",
            "category"
    );

    private final IssueService issueService;

    public IssueController(IssueService issueService) {
        this.issueService = issueService;
    }

    // ============================================================
    // CREATE ISSUE
    // ============================================================

    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<IssueResponse> createIssue(
            @Valid
            @RequestPart("issue")
            CreateIssueRequest request,

            @RequestPart(
                    value = "image",
                    required = false
            )
            MultipartFile image
    ) {

        IssueResponse response =
                issueService.createIssue(
                        request,
                        image
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ============================================================
    // GET CURRENT USER'S ISSUES
    // ============================================================

    @GetMapping("/my")
    public ResponseEntity<List<IssueResponse>> getMyIssues() {

        return ResponseEntity.ok(
                issueService.getMyIssues()
        );
    }

    // ============================================================
    // GET ASSIGNED ISSUES
    // ============================================================

    @GetMapping("/assigned")
    public ResponseEntity<List<IssueResponse>> getAssignedIssues() {

        return ResponseEntity.ok(
                issueService.getAssignedIssues()
        );
    }

    // ============================================================
    // GET ALL ISSUES WITH FILTERING / PAGINATION / SORTING
    // ============================================================

    @GetMapping("/all")
    public ResponseEntity<Page<IssueResponse>> getAllIssues(

            @RequestParam(required = false)
            String keyword,

            @RequestParam(required = false)
            IssueStatus status,

            @RequestParam(required = false)
            IssuePriority priority,

            @RequestParam(required = false)
            IssueCategory category,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size,

            @RequestParam(defaultValue = "createdAt,desc")
            String sort
    ) {

        if (page < 0) {
            throw new IllegalArgumentException(
                    "Page number cannot be negative"
            );
        }

        if (size < 1) {
            throw new IllegalArgumentException(
                    "Page size must be at least 1"
            );
        }

        if (size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException(
                    "Page size cannot exceed "
                            + MAX_PAGE_SIZE
            );
        }

        String[] sortParts = sort.split(",");

        String sortField =
                sortParts[0].trim();

        Sort.Direction direction =
                Sort.Direction.DESC;

        if (sortParts.length > 1) {

            try {

                direction =
                        Sort.Direction.fromString(
                                sortParts[1].trim()
                        );

            } catch (IllegalArgumentException exception) {

                throw new IllegalArgumentException(
                        "Sort direction must be 'asc' or 'desc'"
                );
            }
        }

        if (!ALLOWED_SORT_FIELDS.contains(sortField)) {

            throw new IllegalArgumentException(
                    "Sorting by '"
                            + sortField
                            + "' is not supported. "
                            + "Allowed fields: "
                            + String.join(
                                    ", ",
                                    ALLOWED_SORT_FIELDS
                            )
            );
        }

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        Sort.by(
                                direction,
                                sortField
                        )
                );

        return ResponseEntity.ok(
                issueService.filterIssues(
                        keyword,
                        status,
                        priority,
                        category,
                        pageable
                )
        );
    }

    // ============================================================
    // ADMIN DASHBOARD STATS
    // ============================================================

    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {

        return ResponseEntity.ok(
                issueService.getDashboardStats()
        );
    }

    // ============================================================
    // DEPARTMENT DASHBOARD STATS
    // ============================================================

    @GetMapping("/department/stats")
    public ResponseEntity<DepartmentStatsResponse> getDepartmentStats() {

        return ResponseEntity.ok(
                issueService.getDepartmentStats()
        );
    }

    // ============================================================
    // GET ISSUE BY ID
    // ============================================================

    @GetMapping("/{id}")
    public ResponseEntity<IssueResponse> getIssueById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                issueService.getIssueById(id)
        );
    }

    // ============================================================
    // GET ISSUE STATUS HISTORY
    // ============================================================

    @GetMapping("/{id}/history")
    public ResponseEntity<List<IssueStatusHistoryResponse>> getIssueHistory(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                issueService.getIssueHistory(id)
        );
    }

    // ============================================================
    // CIVIC MEMORY / RECURRING ISSUES
    // ============================================================

    @GetMapping("/{id}/recurring")
    public ResponseEntity<List<RecurringIssueResponse>> getRecurringIssues(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                issueService.findRecurringIssues(id)
        );
    }

    // ============================================================
    // UPDATE ISSUE STATUS
    // ============================================================

    @PatchMapping("/{id}/status")
    public ResponseEntity<IssueResponse> updateIssueStatus(
            @PathVariable Long id,

            @Valid
            @RequestBody
            UpdateIssueStatusRequest request
    ) {

        IssueResponse response =
                issueService.updateIssueStatus(
                        id,
                        request
                );

        return ResponseEntity.ok(response);
    }

    // ============================================================
    // ASSIGN ISSUE TO DEPARTMENT
    // ============================================================

    @PatchMapping("/{id}/assign")
    public ResponseEntity<IssueResponse> assignIssue(
            @PathVariable Long id,

            @Valid
            @RequestBody
            AssignIssueRequest request
    ) {

        IssueResponse response =
                issueService.assignIssue(
                        id,
                        request
                );

        return ResponseEntity.ok(response);
    }
}
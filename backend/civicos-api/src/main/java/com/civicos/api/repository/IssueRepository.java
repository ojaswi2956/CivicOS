package com.civicos.api.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.civicos.api.entity.Issue;
import com.civicos.api.entity.IssueCategory;
import com.civicos.api.entity.IssuePriority;
import com.civicos.api.entity.IssueStatus;
import com.civicos.api.entity.User;

public interface IssueRepository extends JpaRepository<Issue, Long> {

    // =========================================================
    // EXISTING ISSUE QUERIES
    // =========================================================

    List<Issue> findByReportedBy(User user);

    List<Issue> findByAssignedTo(User user);

    List<Issue> findByStatus(IssueStatus status);

    List<Issue> findByPriority(IssuePriority priority);

    List<Issue> findByCategory(IssueCategory category);

    List<Issue> findByStatusAndPriority(
            IssueStatus status,
            IssuePriority priority
    );

    List<Issue> findByStatusAndCategory(
            IssueStatus status,
            IssueCategory category
    );

    List<Issue> findByPriorityAndCategory(
            IssuePriority priority,
            IssueCategory category
    );

    List<Issue> findByStatusAndPriorityAndCategory(
            IssueStatus status,
            IssuePriority priority,
            IssueCategory category
    );

    // =========================================================
    // PAGINATED ISSUE QUERIES
    // =========================================================

    Page<Issue> findAll(Pageable pageable);

    Page<Issue> findByStatus(
            IssueStatus status,
            Pageable pageable
    );

    Page<Issue> findByPriority(
            IssuePriority priority,
            Pageable pageable
    );

    Page<Issue> findByCategory(
            IssueCategory category,
            Pageable pageable
    );

    Page<Issue> findByStatusAndPriority(
            IssueStatus status,
            IssuePriority priority,
            Pageable pageable
    );

    Page<Issue> findByStatusAndCategory(
            IssueStatus status,
            IssueCategory category,
            Pageable pageable
    );

    Page<Issue> findByPriorityAndCategory(
            IssuePriority priority,
            IssueCategory category,
            Pageable pageable
    );

    Page<Issue> findByStatusAndPriorityAndCategory(
            IssueStatus status,
            IssuePriority priority,
            IssueCategory category,
            Pageable pageable
    );

    // =========================================================
    // KEYWORD SEARCH
    // =========================================================

    @Query("""
            SELECT i
            FROM Issue i
            WHERE
                LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR
                LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    Page<Issue> searchByKeyword(
            @Param("keyword") String keyword,
            Pageable pageable
    );

    // =========================================================
    // COMBINED SEARCH + FILTER
    // =========================================================

    @Query("""
            SELECT i
            FROM Issue i
            WHERE
                (
                    :keyword IS NULL
                    OR :keyword = ''
                    OR LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(i.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
                AND
                (
                    :status IS NULL
                    OR i.status = :status
                )
                AND
                (
                    :priority IS NULL
                    OR i.priority = :priority
                )
                AND
                (
                    :category IS NULL
                    OR i.category = :category
                )
            """)
    Page<Issue> searchAndFilter(
            @Param("keyword") String keyword,
            @Param("status") IssueStatus status,
            @Param("priority") IssuePriority priority,
            @Param("category") IssueCategory category,
            Pageable pageable
    );

    // =========================================================
    // DASHBOARD COUNTS
    // =========================================================

    long countByStatus(IssueStatus status);

    long countByPriority(IssuePriority priority);

    long countByAssignedTo(User user);

    long countByAssignedToAndStatus(
            User user,
            IssueStatus status
    );

    long countByStatusAndAssignedToIsNull(IssueStatus status);

    @Query("""
            SELECT issue
            FROM Issue issue
            WHERE (
                (
                    issue.createdAt < :cutoff
                    AND issue.status NOT IN :completedStatuses
                    AND (
                        :assignedUser IS NULL
                        OR issue.assignedTo = :assignedUser
                    )
                )
                OR (
                    :includeUnassigned = true
                    AND issue.status = :unassignedStatus
                    AND issue.assignedTo IS NULL
                )
            )
            ORDER BY
                CASE
                    WHEN issue.status = :unassignedStatus
                        AND issue.assignedTo IS NULL
                    THEN 0
                    ELSE 1
                END,
                issue.createdAt ASC
            """)
    Page<Issue> findDashboardAttentionIssues(
            @Param("cutoff") LocalDateTime cutoff,
            @Param("completedStatuses") List<IssueStatus> completedStatuses,
            @Param("assignedUser") User assignedUser,
            @Param("includeUnassigned") boolean includeUnassigned,
            @Param("unassignedStatus") IssueStatus unassignedStatus,
            Pageable pageable
    );

    @Query("""
            SELECT COUNT(issue)
            FROM Issue issue
            WHERE issue.createdAt < :cutoff
              AND issue.status NOT IN :completedStatuses
              AND (
                  :assignedUser IS NULL
                  OR issue.assignedTo = :assignedUser
              )
            """)
    long countOverdueIssues(
            @Param("cutoff") LocalDateTime cutoff,
            @Param("completedStatuses") List<IssueStatus> completedStatuses,
            @Param("assignedUser") User assignedUser
    );
    
    // =========================================================
    // CIVIC MEMORY - FIND NEARBY ISSUES
    // =========================================================

    @Query(value = """
            SELECT *
            FROM issues i
            WHERE i.category = :category
              AND i.id <> :issueId
              AND (
                  6371000 * 2 * ASIN(
                      SQRT(
                          POWER(SIN(RADIANS(i.latitude - :latitude) / 2), 2)
                          +
                          COS(RADIANS(:latitude))
                          * COS(RADIANS(i.latitude))
                          * POWER(SIN(RADIANS(i.longitude - :longitude) / 2), 2)
                      )
                  )
              ) <= :radiusMeters
            ORDER BY i.created_at DESC
            """, nativeQuery = true)
    List<Issue> findNearbyIssues(
            @Param("issueId") Long issueId,
            @Param("category") String category,
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radiusMeters") Double radiusMeters
    );
}
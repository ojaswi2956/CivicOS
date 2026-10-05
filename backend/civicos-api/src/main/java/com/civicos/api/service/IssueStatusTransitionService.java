package com.civicos.api.service;

import org.springframework.stereotype.Service;

import com.civicos.api.entity.IssueStatus;
import com.civicos.api.entity.Role;
import com.civicos.api.exception.BadRequestException;

@Service
public class IssueStatusTransitionService {

    // =========================================================
    // VALIDATE STATUS TRANSITION
    // =========================================================

    public void validateTransition(
            Role role,
            IssueStatus currentStatus,
            IssueStatus newStatus
    ) {

        if (role == Role.ADMIN) {

            validateAdminTransition(
                    currentStatus,
                    newStatus
            );

            return;
        }

        if (role == Role.DEPARTMENT) {

            validateDepartmentTransition(
                    currentStatus,
                    newStatus
            );

            return;
        }

        throw new BadRequestException(
                "Citizens cannot update issue status"
        );
    }

    // =========================================================
    // ADMIN TRANSITIONS
    // =========================================================

    private void validateAdminTransition(
            IssueStatus currentStatus,
            IssueStatus newStatus
    ) {

        if (currentStatus == IssueStatus.REPORTED &&
                newStatus == IssueStatus.VERIFIED) {

            return;
        }

        throw new BadRequestException(
                "Admin can only change REPORTED to VERIFIED"
        );
    }

    // =========================================================
    // DEPARTMENT TRANSITIONS
    // =========================================================

    private void validateDepartmentTransition(
            IssueStatus currentStatus,
            IssueStatus newStatus
    ) {

        if (currentStatus == IssueStatus.ASSIGNED &&
                newStatus == IssueStatus.IN_PROGRESS) {

            return;
        }

        if (currentStatus == IssueStatus.IN_PROGRESS &&
                newStatus == IssueStatus.RESOLVED) {

            return;
        }

        throw new BadRequestException(
                "Invalid department status transition"
        );
    }
}
package com.civicos.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.civicos.api.entity.Issue;
import com.civicos.api.entity.IssueStatusHistory;

public interface IssueStatusHistoryRepository
        extends JpaRepository<IssueStatusHistory, Long> {

    List<IssueStatusHistory> findByIssueOrderByChangedAtAsc(Issue issue);
}
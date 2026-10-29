package com.civicos.api;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.civicos.api.repository.IssueRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class CivicosApiApplicationTests {

	@Autowired
	private IssueRepository issueRepository;

	@Test
	void contextLoads() {
	}

	@Test
	void departmentIssueSummaryQueryExecutes() {
		assertNotNull(issueRepository.findDepartmentIssueSummaries());
	}

}

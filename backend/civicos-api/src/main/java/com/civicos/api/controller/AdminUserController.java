package com.civicos.api.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.civicos.api.dto.DepartmentOfficerResponse;
import com.civicos.api.entity.Role;
import com.civicos.api.repository.UserRepository;

@RestController
@RequestMapping("/api/admin")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/department-officers")
    public List<DepartmentOfficerResponse> getDepartmentOfficers() {

        return userRepository
                .findAllByRoleOrderByNameAsc(Role.DEPARTMENT)
                .stream()
                .map(user -> new DepartmentOfficerResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail()
                ))
                .toList();
    }
}
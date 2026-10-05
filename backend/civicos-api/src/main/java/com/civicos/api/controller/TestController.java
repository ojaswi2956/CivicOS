package com.civicos.api.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/test")
    public String test() {
        return "JWT authentication is working!";
    }

    @GetMapping("/api/test/me")
    public String me(Authentication authentication) {

        if (authentication == null) {
            return "NO AUTHENTICATION";
        }

        return authentication.getName()
                + " | "
                + authentication.getAuthorities();
    }
}
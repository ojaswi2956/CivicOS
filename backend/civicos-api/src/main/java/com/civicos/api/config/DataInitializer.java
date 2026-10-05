package com.civicos.api.config;

import com.civicos.api.entity.Role;
import com.civicos.api.entity.User;
import com.civicos.api.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner createDevelopmentUsers(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {

            // -----------------------------------------
            // DEVELOPMENT ADMIN
            // -----------------------------------------

            String adminEmail = "admin@civicos.com";

            if (!userRepository.existsByEmail(adminEmail)) {

                User admin = new User();

                admin.setName("CivicOS Administrator");
                admin.setEmail(adminEmail);

                admin.setPassword(
                        passwordEncoder.encode("Admin@123")
                );

                admin.setRole(Role.ADMIN);
                admin.setCreatedAt(LocalDateTime.now());

                userRepository.save(admin);

                System.out.println(
                        "CivicOS development admin created: "
                                + adminEmail
                );
            }

            // -----------------------------------------
            // DEVELOPMENT DEPARTMENT USER
            // -----------------------------------------

            String departmentEmail =
                    "department@civicos.com";

            if (!userRepository.existsByEmail(departmentEmail)) {

                User department = new User();

                department.setName(
                        "CivicOS Department Officer"
                );

                department.setEmail(departmentEmail);

                department.setPassword(
                        passwordEncoder.encode("Dept@123")
                );

                department.setRole(Role.DEPARTMENT);
                department.setCreatedAt(LocalDateTime.now());

                userRepository.save(department);

                System.out.println(
                        "CivicOS development department user created: "
                                + departmentEmail
                );
            }
        };
    }
}
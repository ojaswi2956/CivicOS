package com.civicos.api.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .cors(cors -> cors.configurationSource(
                        corsConfigurationSource()
                ))

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        // Authentication
                        .requestMatchers("/api/auth/**")
                        .permitAll()

                        // Swagger / OpenAPI
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        )
                        .permitAll()

                        // Uploaded evidence images
                        .requestMatchers("/uploads/**")
                        .permitAll()

                        // Admin dashboard
                        .requestMatchers(
                                "/api/issues/dashboard/stats"
                        )
                        .hasRole("ADMIN")

                        // Admin assignment
                        .requestMatchers(
                                "/api/issues/*/assign"
                        )
                        .hasRole("ADMIN")

                        // Admin-only department officer list
                        .requestMatchers(
                                "/api/admin/department-officers"
                        )
                        .hasRole("ADMIN")

                        // Department assigned issues
                        .requestMatchers(
                                "/api/issues/assigned"
                        )
                        .hasRole("DEPARTMENT")

                        // Department dashboard
                        .requestMatchers(
                                "/api/issues/department/stats"
                        )
                        .hasRole("DEPARTMENT")

                        // Status updates
                        .requestMatchers(
                                "/api/issues/*/status"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "DEPARTMENT"
                        )

                        // Recurring issue detection
                        .requestMatchers(
                                "/api/issues/*/recurring"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "DEPARTMENT"
                        )

                        // All issues
                        .requestMatchers(
                                "/api/issues/all"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "DEPARTMENT"
                        )

                        // Everything else requires authentication
                        .anyRequest()
                        .authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration =
                new CorsConfiguration();

        configuration.setAllowedOrigins(
                List.of(
                        "http://localhost:5173"
                )
        );

        configuration.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        configuration.setAllowedHeaders(
                List.of(
                        "Authorization",
                        "Content-Type"
                )
        );

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}
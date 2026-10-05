package com.civicos.api.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class FileStorageConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(
            ResourceHandlerRegistry registry
    ) {

        Path uploadDirectory =
                Paths.get("uploads/issues")
                        .toAbsolutePath()
                        .normalize();

        String uploadLocation =
                uploadDirectory.toUri().toString();

        registry.addResourceHandler(
                "/uploads/issues/**"
        ).addResourceLocations(
                uploadLocation
        );
    }
}
package com.civicos.api.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/uploads")
public class UploadController {

    private static final Path UPLOAD_DIRECTORY =
            Paths.get(
                    "D:/CivicOS/backend/civicos-api/uploads/issues"
            ).toAbsolutePath().normalize();

    @GetMapping("/issues/{filename:.+}")
    public ResponseEntity<Resource> getIssueImage(
            @PathVariable String filename
    ) {

        try {
            String safeFilename =
                    Paths.get(filename)
                            .getFileName()
                            .toString();

            Path filePath =
                    UPLOAD_DIRECTORY
                            .resolve(safeFilename)
                            .normalize();

            System.out.println(
                    "Looking for evidence image: "
                            + filePath
            );

            if (!filePath.startsWith(UPLOAD_DIRECTORY)) {
                return ResponseEntity.badRequest().build();
            }

            if (!Files.exists(filePath)) {
                System.out.println(
                        "Evidence image NOT FOUND: "
                                + filePath
                );

                return ResponseEntity.notFound().build();
            }

            if (!Files.isRegularFile(filePath)) {
                System.out.println(
                        "Evidence path is not a file: "
                                + filePath
                );

                return ResponseEntity.notFound().build();
            }

            Resource resource =
                    new UrlResource(filePath.toUri());

            String contentType =
                    Files.probeContentType(filePath);

            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(
                            MediaType.parseMediaType(contentType)
                    )
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" +
                                    safeFilename +
                                    "\""
                    )
                    .body(resource);

        } catch (Exception exception) {

            exception.printStackTrace();

            return ResponseEntity
                    .internalServerError()
                    .build();
        }
    }
}
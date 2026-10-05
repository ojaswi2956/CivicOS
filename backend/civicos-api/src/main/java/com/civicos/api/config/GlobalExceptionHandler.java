package com.civicos.api.config;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.civicos.api.exception.BadRequestException;
import com.civicos.api.exception.ForbiddenException;
import com.civicos.api.exception.ResourceNotFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // =========================================================
    // VALIDATION ERRORS
    // =========================================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException exception
    ) {

        Map<String, String> errors =
                new LinkedHashMap<>();

        exception.getBindingResult()
                .getFieldErrors()
                .forEach(error ->
                        errors.put(
                                error.getField(),
                                error.getDefaultMessage()
                        )
                );

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("status", 400);
        response.put("error", "Validation failed");
        response.put("details", errors);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    // =========================================================
    // INVALID REQUEST PARAMETERS
    // =========================================================

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException exception
    ) {

        String parameterName =
                exception.getName();

        String message =
                "Invalid value for parameter '"
                        + parameterName
                        + "'";

        if (exception.getRequiredType() != null &&
                exception.getRequiredType().isEnum()) {

            Object[] enumConstants =
                    exception.getRequiredType()
                            .getEnumConstants();

            StringBuilder allowedValues =
                    new StringBuilder();

            if (enumConstants != null) {

                for (int i = 0;
                     i < enumConstants.length;
                     i++) {

                    if (i > 0) {
                        allowedValues.append(", ");
                    }

                    allowedValues.append(
                            enumConstants[i].toString()
                    );
                }
            }

            message +=
                    ". Allowed values: "
                            + allowedValues;
        }

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("status", 400);
        response.put("error", "Invalid request parameter");
        response.put("message", message);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    // =========================================================
    // BAD REQUEST
    // =========================================================

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(
            BadRequestException exception
    ) {

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("status", 400);
        response.put("error", "Bad request");
        response.put("message", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    // =========================================================
    // RESOURCE NOT FOUND
    // =========================================================

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            ResourceNotFoundException exception
    ) {

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("status", 404);
        response.put("error", "Resource not found");
        response.put("message", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(response);
    }

    // =========================================================
    // FORBIDDEN
    // =========================================================

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(
            ForbiddenException exception
    ) {

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("status", 403);
        response.put("error", "Forbidden");
        response.put("message", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(response);
    }

    // =========================================================
    // ILLEGAL ARGUMENT
    // =========================================================

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException exception
    ) {

        Map<String, Object> response =
                new LinkedHashMap<>();

        response.put("status", 400);
        response.put("error", "Invalid request");
        response.put("message", exception.getMessage());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    // =========================================================
    // UNEXPECTED ERRORS
    // =========================================================

    @ExceptionHandler(Exception.class)
public ResponseEntity<Map<String, Object>> handleGeneralException(
        Exception exception
) {

    // Print the real exception to the Spring Boot console
    exception.printStackTrace();

    Map<String, Object> response =
            new LinkedHashMap<>();

    response.put("status", 500);
    response.put("error", "Internal server error");
    response.put(
            "message",
            "An unexpected error occurred"
    );

    return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(response);
}
}
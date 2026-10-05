# ============================================
# Stage 1: Build
# ============================================
FROM eclipse-temurin:25-jdk AS build

WORKDIR /app

# Copy Maven wrapper and project files
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn

# Make Maven wrapper executable
RUN chmod +x mvnw

# Download dependencies first for better Docker caching
RUN ./mvnw dependency:go-offline -DskipTests

# Copy source code
COPY src src

# Build Spring Boot application
RUN ./mvnw clean package -DskipTests


# ============================================
# Stage 2: Run
# ============================================
FROM eclipse-temurin:25-jre

WORKDIR /app

# Create upload directory
RUN mkdir -p /app/uploads/issues

# Copy built application
COPY --from=build /app/target/*.jar app.jar

# Render provides the PORT environment variable
EXPOSE 8080

# Start Spring Boot
ENTRYPOINT ["java", "-jar", "app.jar"]
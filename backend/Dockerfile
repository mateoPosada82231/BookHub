# ============================
# Multi-stage build for Spring Boot
# ============================

# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copy Maven wrapper and pom
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Make mvnw executable
RUN chmod +x mvnw

# Download dependencies (cached layer)
RUN ./mvnw dependency:go-offline -B

# Copy source and build
COPY src src
RUN ./mvnw package -DskipTests -B

# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built jar
COPY --from=build /app/target/*.jar app.jar

# Create logs directory
RUN mkdir -p /app/logs

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]

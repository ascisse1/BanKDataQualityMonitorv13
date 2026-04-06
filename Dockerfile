# --- Stage 1: Build frontend ---
FROM node:18-alpine AS frontend
WORKDIR /app
COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci
COPY apps/frontend/ .
RUN npm run build

# --- Stage 2: Build backend with frontend embedded ---
FROM maven:3.9-eclipse-temurin-17-alpine AS backend
WORKDIR /app
COPY apps/backend/pom.xml ./
RUN mvn dependency:go-offline -B
COPY apps/backend/src/ src/
# Copy frontend build into Spring Boot static resources
COPY --from=frontend /app/dist/ src/main/resources/static/
RUN mvn clean package -DskipTests -B

# --- Stage 3: Runtime ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

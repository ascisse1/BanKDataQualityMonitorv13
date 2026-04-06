# --- Stage 1: Build frontend ---
FROM node:18-alpine AS frontend
WORKDIR /app
COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci
COPY apps/frontend/ .
RUN npm run build

# --- Stage 2: Build backend with frontend embedded ---
FROM eclipse-temurin:17-jdk-alpine AS backend
WORKDIR /app
COPY apps/backend/.mvn/ .mvn/
COPY apps/backend/mvnw apps/backend/pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B
COPY apps/backend/src/ src/
# Copy frontend build into Spring Boot static resources
COPY --from=frontend /app/dist/ src/main/resources/static/
RUN ./mvnw clean package -DskipTests -B

# --- Stage 3: Runtime ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

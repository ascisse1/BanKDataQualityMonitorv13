# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bank Data Quality Monitor for BSIC Bank - a banking data quality surveillance system with CBS (Core Banking System) reconciliation. The application detects anomalies in customer data, enforces "4 Eyes" validation workflow, integrates with UiPath RPA for automated corrections, and reconciles changes against Informix CBS.

## Development Commands

```bash
# Frontend development (Vite dev server on port 5174)
npm run dev

# Build production frontend
npm run build

# Lint (ESLint)
npm run lint

# Spring Boot backend (port 8080)
cd backend-java && mvn spring-boot:run

# Spring Boot with dev profile (uses Docker Informix)
cd backend-java && mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Build Spring Boot backend
cd backend-java && mvn clean install

# Run Spring Boot tests
cd backend-java && mvn test

# Start monitoring stack (Redis, Prometheus, Grafana)
docker-compose up -d

# Test Informix connection
npm run test:informix
npm run diagnose:informix
```

## Architecture

### Stack Overview

**Frontend (React + Vite)** - Port 5174
- React 18 + TypeScript
- TailwindCSS styling
- Zustand for global state, React Query for server state
- @tanstack/react-table + @tanstack/react-virtual for large datasets (120k+ records)
- ApexCharts and Recharts for visualizations
- react-hook-form for forms
- Vite proxy forwards `/api` and `/oauth2` to Spring Boot

**Backend (Spring Boot)** - Port 8080
- Spring Boot 3.2 with Java 17
- Keycloak OAuth2 for authentication (BFF pattern)
- Multi-datasource: MySQL (primary) + Informix CBS (read-only)
- Liquibase for database migrations
- Camunda BPM for workflow orchestration
- Redis caching
- Prometheus metrics via Actuator

### Data Flow
1. Frontend detects anomalies from uploaded/fetched data
2. User creates ticket with proposed corrections
3. Supervisor validates (4 Eyes approval)
4. RPA (UiPath) applies corrections to CBS
5. Spring Boot reconciles changes via JDBC to Informix

### Database Architecture
- **MySQL**: Application data (anomalies, tickets, corrections, users, audit)
- **Informix CBS**: Core banking data (read-only via JDBC)

## Key Directory Structure

```
src/                    # React frontend (TypeScript)
  pages/                # Page components by feature
  services/             # API services (apiService.ts, reconciliationApiService.ts)
  context/              # React context providers (Auth, Notifications)
  hooks/                # Custom React hooks
  types/                # TypeScript type definitions

backend-java/           # Spring Boot backend
  src/main/java/com/bsic/dataqualitybackend/
    controller/         # REST controllers
    service/            # Business logic
    repository/         # Data access (JPA + JDBC for Informix)
    config/             # Configuration (DataSourceConfig, SecurityConfig)
    dto/                # Data transfer objects
    model/              # JPA entities
  src/main/resources/
    application.yml            # Base config
    application-dev.yml        # Dev profile (Docker Informix)
    application-docker.yml     # Docker deployment
    application-local.yml      # Local development
    db/changelog/              # Liquibase migrations
    bpmn/                      # Camunda workflow definitions

database/               # SQL schemas and seed data
scripts/                # Setup and utility scripts
docker/                 # Docker configurations
monitoring/             # Prometheus/Grafana config
```

## Spring Boot Profiles

- **default**: Production-ready config
- **dev**: Development with Docker Informix on port 9088, Liquibase drop-first
- **docker**: Docker deployment with containerized services
- **local**: Local development without Informix

## Environment Configuration

Spring Boot uses environment variables or application-{profile}.yml:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL
- `INFORMIX_HOST`, `INFORMIX_PORT`, `INFORMIX_DATABASE`, `INFORMIX_USER`, `INFORMIX_PASSWORD` - CBS
- `KEYCLOAK_ISSUER_URI`, `KEYCLOAK_REALM` - OAuth2
- `REDIS_HOST`, `REDIS_PORT` - Caching

## API Proxy

Vite dev server proxies to Spring Boot (port 8080):
- `/api/*` - REST API endpoints
- `/oauth2/*` - OAuth2 authentication
- `/login`, `/logout` - Session management

## User Roles

- **admin**: Full system access, user management
- **auditor**: Read access + ticket validation
- **agency**: CRUD for their agency's anomalies only

Roles are managed via Keycloak realm configuration.

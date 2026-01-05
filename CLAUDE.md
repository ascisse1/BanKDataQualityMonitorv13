# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bank Data Quality Monitor for BSIC Bank - a banking data quality surveillance system with CBS (Core Banking System) reconciliation. The application detects anomalies in customer data, enforces "4 Eyes" validation workflow, integrates with UiPath RPA for automated corrections, and reconciles changes against Informix CBS.

## Development Commands

```bash
# Frontend development (Vite dev server on port 5174)
npm run dev

# Backend Node.js Express (port 3001)
npm run server

# Run both frontend and backend concurrently
npm run dev:full

# Build production frontend
npm run build

# Lint (ESLint)
npm run lint

# Database setup
npm run setup:mysql      # Create MySQL schema
npm run seed:mysql       # Load demo data
npm run db:init          # Setup + seed combined
npm run db:reconciliation # Create reconciliation tables

# Spring Boot backend (port 8080) - for CBS reconciliation
cd backend-java && mvn spring-boot:run

# Build Spring Boot backend
cd backend-java && mvn clean install

# Test Informix connection
npm run test:informix
npm run diagnose:informix
```

## Architecture

### Dual Backend Architecture

**Node.js Express (port 3001)** - Primary API server
- Authentication (JWT)
- Anomaly detection and management
- Ticket system (4 Eyes validation workflow)
- File uploads (CSV/Excel)
- MySQL database operations

**Spring Boot (port 8080)** - CBS Reconciliation server
- JDBC connection to Informix CBS (read-only)
- Reconciliation of applied corrections vs CBS data
- Camunda BPM workflow orchestration
- Prometheus metrics via Actuator

### Data Flow
1. Frontend detects anomalies from uploaded/fetched data
2. User creates ticket with proposed corrections
3. Supervisor validates (4 Eyes approval)
4. RPA (UiPath) applies corrections to CBS
5. Spring Boot reconciles changes via JDBC to Informix

### Database Architecture
- **MySQL**: Application data (anomalies, tickets, corrections, users, audit)
- **Informix CBS**: Core banking data (read-only via JDBC from Spring Boot)

## Key Directory Structure

```
src/                    # React frontend (TypeScript)
  pages/                # Page components by feature
  services/             # API services (apiService.ts, reconciliationApiService.ts)
  context/              # React context providers (Auth, Notifications)
  hooks/                # Custom React hooks
  types/                # TypeScript type definitions

server/                 # Node.js Express backend
  index.js              # Entry point
  database.js           # MySQL connection
  mysqlDatabase.js      # MySQL operations
  userRoutes.js         # User/auth routes
  reconciliationEndpoints.js  # Reconciliation API
  validationEndpoints.js      # Validation API

backend-java/           # Spring Boot backend
  src/main/java/com/bsic/dataqualitybackend/
    controller/         # REST controllers
    service/            # Business logic
    repository/         # Data access (JPA + JDBC)
    config/             # Configuration classes

database/               # SQL schemas
scripts/                # Setup and utility scripts
```

## Frontend Patterns

- **State**: Zustand for global state, React Query for server state
- **Tables**: @tanstack/react-table with @tanstack/react-virtual for large datasets (120k+ records)
- **Charts**: ApexCharts and Recharts
- **Forms**: react-hook-form
- **Styling**: TailwindCSS

## Backend Patterns

**Node.js Express:**
- All routes in `server/*.js` files
- MySQL via mysql2 with connection pooling
- JWT authentication middleware
- Express rate limiting and Helmet security

**Spring Boot:**
- Multi-datasource config (MySQL primary + Informix secondary read-only)
- HikariCP connection pooling for Informix
- Camunda BPM for workflow
- Lombok for DTOs
- MapStruct for entity mapping

## Environment Configuration

Copy `.env.example` to `.env` and configure:
- MySQL connection (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
- Informix CBS connection (INFORMIX_HOST, INFORMIX_PORT, INFORMIX_DATABASE, etc.)
- JWT_SECRET for authentication
- VITE_API_URL (Node.js backend URL)
- VITE_SPRING_BOOT_URL (Spring Boot backend URL)

## API Proxy

Vite dev server proxies `/api` requests to the Node.js backend (port 3001). Spring Boot endpoints are called directly at their configured URL.

## User Roles

- **admin**: Full system access, user management
- **auditor**: Read access + ticket validation
- **agency**: CRUD for their agency's anomalies only

Demo users: admin@bsic.ci / admin123, auditor@bsic.ci / auditor123

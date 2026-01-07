# Full Stack Deployment Guide - Bank Data Quality Platform

Complete guide for deploying the integrated Spring Boot + React + Camunda + UiPath system.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Camunda Configuration](#camunda-configuration)
6. [UiPath Integration](#uipath-integration)
7. [Database Setup](#database-setup)
8. [Testing](#testing)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│  React Frontend │  (Port 5173/3000)
│  (Vite + React) │
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│ Spring Boot API │  (Port 8080)
│   + Camunda     │
└────────┬────────┘
         │
    ┌────┼─────┬──────────┐
    │    │     │          │
    ↓    ↓     ↓          ↓
┌────────┐ ┌──────┐ ┌─────────┐
│  LDAP  │ │ DB   │ │ UiPath  │
│  Auth  │ │ PG   │ │ Orchestr│
└────────┘ └──────┘ └─────────┘
```

### Key Components

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Spring Boot 3.2 + Java 17
- **Workflow**: Camunda Platform 7.21
- **RPA**: UiPath Orchestrator
- **Database**: PostgreSQL 15+
- **Authentication**: Spring Security + JWT + LDAP

---

## 🔧 Prerequisites

### Software Requirements

```bash
# Backend
- Java JDK 17 or higher
- Maven 3.8+
- PostgreSQL 15+

# Frontend
- Node.js 18+
- npm 9+

# Optional
- Docker & Docker Compose
- UiPath Orchestrator
- LDAP Server (Active Directory)
```

### Environment Setup

```bash
# Check versions
java -version
mvn -version
node -version
npm -version
psql --version
```

---

## 🚀 Backend Deployment

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb bank_data_quality

# Or using psql
psql -U postgres
CREATE DATABASE bank_data_quality;
\q
```

### 2. Configure Application

Edit `backend-java/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/bank_data_quality
    username: your_db_user
    password: your_db_password

  ldap:
    urls: ldap://your-ldap-server:389
    base: dc=example,dc=com
    username: cn=admin,dc=example,dc=com
    password: your_ldap_password

security:
  jwt:
    secret: your-production-jwt-secret-key-change-this
    expiration: 86400000  # 24 hours
```

### 3. Build Backend

```bash
cd backend-java

# Clean build
mvn clean install

# Or skip tests for faster build
mvn clean install -DskipTests
```

### 4. Run Backend

```bash
# Development mode
mvn spring-boot:run

# Or run JAR directly
java -jar target/data-quality-backend-1.0.0.jar

# Production with custom profile
java -jar -Dspring.profiles.active=prod target/data-quality-backend-1.0.0.jar
```

Backend will start on **http://localhost:8080**

### 5. Verify Backend

```bash
# Health check
curl http://localhost:8080/actuator/health

# Expected response:
# {"status":"UP"}

# Test authentication
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🎨 Frontend Deployment

### 1. Install Dependencies

```bash
cd /path/to/project
npm install
```

### 2. Configure Environment

Create `.env.production`:

```env
# API Configuration
VITE_API_BASE_URL=http://your-backend-url:8080

# Demo mode (set to false in production)
VITE_DEMO_MODE=false

# Supabase (optional)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### 3. Build Frontend

```bash
# Production build
npm run build

# Build output will be in /dist directory
```

### 4. Deploy Frontend

#### Option A: Static Hosting (Netlify, Vercel)

```bash
# Netlify
netlify deploy --prod --dir=dist

# Vercel
vercel --prod
```

#### Option B: Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/bank-data-quality/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Option C: Apache

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/bank-data-quality/dist

    <Directory /var/www/bank-data-quality/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    ProxyPass /api http://localhost:8080/api
    ProxyPassReverse /api http://localhost:8080/api
</VirtualHost>
```

### 5. Run Development Server

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔄 Camunda Configuration

### 1. Access Camunda Cockpit

```
URL: http://localhost:8080/camunda
Username: admin
Password: admin
```

### 2. Deploy BPMN Process

The ticket workflow is automatically deployed on startup from:
```
backend-java/src/main/resources/bpmn/ticket-workflow.bpmn
```

### 3. Verify Deployment

```bash
# Check deployed processes
curl http://localhost:8080/camunda/api/engine/default/process-definition

# Start process instance (test)
curl -X POST http://localhost:8080/api/workflow/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "ticketId": 1,
    "clientId": "CLI001",
    "agencyCode": "AGE001",
    "priority": "HIGH"
  }'
```

---

## 🤖 UiPath Integration

### 1. Configure UiPath Orchestrator

Update `application.yml`:

```yaml
uipath:
  orchestrator:
    url: https://your-orchestrator-url
    tenant: your_tenant
    client-id: your_client_id
    client-secret: your_client_secret
    folder: Production
```

### 2. Create UiPath Processes

Required processes:
- **Data Correction Process**: Fixes customer data anomalies
- **Validation Process**: Validates corrected data
- **Bulk Update Process**: Handles batch corrections

### 3. Test RPA Integration

```bash
# Start RPA job via API
curl -X POST http://localhost:8080/api/rpa/jobs/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "ticketId": 1,
    "processInstanceId": "abc-123",
    "action": "CORRECT_DATA"
  }'

# Check job status
curl http://localhost:8080/api/rpa/jobs/{jobId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 💾 Database Setup

### 1. Run Migrations

Migrations run automatically on startup via Flyway:

```bash
# Migrations location
backend-java/src/main/resources/db/migration/

# Files:
V1__initial_schema.sql      # Core tables
V2__ticket_system.sql       # Ticket tables
V3__rpa_jobs.sql           # RPA tracking
V4__kpis.sql               # KPI metrics
```

### 2. Manual Migration (if needed)

```bash
cd backend-java
mvn flyway:migrate
```

### 3. Seed Test Data

```sql
-- Create admin user
INSERT INTO users (username, email, password, first_name, last_name, role, status)
VALUES ('admin', 'admin@bank.ml',
        '$2a$10$...', -- bcrypt hash of 'admin123'
        'Admin', 'System', 'ADMIN', 'ACTIVE');

-- Create test agencies
INSERT INTO agencies (code, name) VALUES
  ('AGE001', 'Agence Principale'),
  ('AGE002', 'Agence Secondaire');
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend-java

# Run all tests
mvn test

# Run specific test
mvn test -Dtest=AuthControllerTest

# Run integration tests
mvn verify
```

### Frontend Tests

```bash
# Install test dependencies
npm install --save-dev

# Run tests (when configured)
npm test
```

### End-to-End Testing

```bash
# 1. Start backend
cd backend-java && mvn spring-boot:run

# 2. Start frontend
cd .. && npm run dev

# 3. Test authentication
Login: http://localhost:5173/login
- Username: admin
- Password: admin123

# 4. Test workflow
- Navigate to /tickets
- Click "Nouveau Ticket"
- Fill form and submit
- Verify task appears in list

# 5. Test RPA monitoring
- Navigate to /workflow
- Check RPA job status
```

---

## 📊 Monitoring

### 1. Application Metrics

```bash
# Health endpoint
curl http://localhost:8080/actuator/health

# Metrics
curl http://localhost:8080/actuator/metrics

# Info
curl http://localhost:8080/actuator/info
```

### 2. Camunda Monitoring

```
Cockpit: http://localhost:8080/camunda/app/cockpit
- Process instances
- Job executions
- Incidents
```

### 3. KPI Dashboard

```
Frontend: http://localhost:5173/kpis
- Closure Rate
- SLA Compliance
- Avg Resolution Time
```

### 4. Logging

```bash
# Backend logs
tail -f backend-java/logs/application.log

# Frontend console
Browser DevTools → Console
```

---

## 🔧 Troubleshooting

### Backend Issues

#### Database Connection Failed
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
psql -U postgres -h localhost -d bank_data_quality

# Fix: Update application.yml with correct credentials
```

#### Camunda Process Not Deploying
```bash
# Check BPMN file syntax
# Verify file location: src/main/resources/bpmn/

# View logs
grep "BPMN" backend-java/logs/application.log
```

#### LDAP Authentication Failed
```bash
# Test LDAP connection
ldapsearch -x -H ldap://your-server:389 -D "cn=admin,dc=example,dc=com" -W

# Fix: Update LDAP config in application.yml
```

### Frontend Issues

#### API Connection Failed
```bash
# Check backend is running
curl http://localhost:8080/actuator/health

# Verify VITE_API_BASE_URL in .env
# Check CORS configuration in backend
```

#### Build Failed
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build

# Check Node version
node -v  # Should be 18+
```

### Workflow Issues

#### Tasks Not Appearing
```bash
# Check Camunda logs
# Verify process instance started
curl http://localhost:8080/api/workflow/tasks/user/{userId}

# Check user ID and role
```

#### RPA Job Stuck
```bash
# Check job status
GET /api/rpa/jobs/{jobId}

# Retry failed job
POST /api/rpa/jobs/{jobId}/retry

# Cleanup stuck jobs
POST /api/rpa/jobs/cleanup-stuck?timeoutMinutes=30
```

---

## 🔐 Security Checklist

- [ ] Change default JWT secret in production
- [ ] Configure HTTPS/TLS
- [ ] Update LDAP credentials
- [ ] Enable Spring Security CSRF protection
- [ ] Configure CORS allowed origins
- [ ] Set up firewall rules
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Rate limiting enabled

---

## 📞 Support

For issues or questions:
- Check logs in `backend-java/logs/`
- Review Camunda Cockpit for workflow issues
- Check browser console for frontend errors
- Verify all services are running

---

## 📝 Next Steps

1. **Configure Production Environment**
   - Set up SSL/TLS certificates
   - Configure production database
   - Set up backup strategy

2. **Integrate UiPath**
   - Deploy RPA processes
   - Test automation flows
   - Monitor job execution

3. **User Training**
   - Admin console walkthrough
   - Ticket creation process
   - KPI interpretation

4. **Go Live Checklist**
   - ✅ Database migrated
   - ✅ Backend deployed
   - ✅ Frontend deployed
   - ✅ LDAP configured
   - ✅ Camunda working
   - ✅ Monitoring setup
   - ✅ Backup configured

---

**Last Updated**: January 2026
**Version**: 1.0.0

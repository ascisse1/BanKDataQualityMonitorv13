# Environment Setup Guide - Amplitude CBS Data

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENVIRONMENTS                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│      DEV        │      DEMO       │         PRODUCTION          │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ Informix Docker │ Informix Docker │    Informix Server          │
│ 10K records     │ 100K records    │    Real CBS Data            │
│ Local machine   │ Shared server   │    Bank infrastructure      │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

## Option 1: Docker Informix (Recommended)

### Prerequisites
- Docker Desktop installed
- Minimum 4GB RAM allocated to Docker

### 1. Start Informix Container

```bash
# Create docker-compose.yml for Informix
docker-compose -f docker/docker-compose.informix.yml up -d
```

### 2. Data Volume by Environment

| Environment | Clients | Accounts | Use Case |
|-------------|---------|----------|----------|
| **dev**     | 1,000   | ~1,500   | Fast local testing |
| **test**    | 10,000  | ~15,000  | Integration tests |
| **demo**    | 100,000 | ~150,000 | Client presentations |

---

## Option 2: MySQL for Development (Simpler)

For rapid development without Informix complexity, use MySQL with adapted DDL.
Spring Boot can switch datasources via profiles.

---

## Recommended Setup

### Step 1: Docker Infrastructure

```yaml
# docker/docker-compose.informix.yml
version: '3.8'

services:
  informix-cbs:
    image: ibmcom/informix-developer-database:latest
    container_name: bdqm-informix-cbs
    hostname: informix-cbs
    environment:
      - LICENSE=accept
      - SIZE=small
      - DBNAME=amplitude
      - INFORMIX_USER=bdqm
      - INFORMIX_PASSWORD=bdqm2024
    ports:
      - "9088:9088"    # Informix DRDA
      - "9089:9089"    # Informix SQLI
      - "27017:27017"  # REST API
      - "27018:27018"  # MongoDB wire protocol
    volumes:
      - informix_data:/opt/ibm/data
      - ./init-scripts:/opt/ibm/scripts
    healthcheck:
      test: ["CMD", "echo", "select 1 from systables" | "dbaccess", "sysmaster"]
      interval: 30s
      timeout: 10s
      retries: 5

volumes:
  informix_data:
```

### Step 2: Initialization Scripts

```bash
# docker/init-scripts/01-create-schema.sh
#!/bin/bash
dbaccess amplitude /opt/ibm/scripts/amplitude_ddl_informix.sql

# docker/init-scripts/02-load-data.sh
#!/bin/bash
# Load based on environment
if [ "$ENV" = "dev" ]; then
    dbaccess amplitude /opt/ibm/scripts/amplitude_seed_data_1k.sql
elif [ "$ENV" = "demo" ]; then
    dbaccess amplitude /opt/ibm/scripts/amplitude_seed_data_100k.sql
fi
```

### Step 3: Spring Boot Profiles

```yaml
# backend-java/src/main/resources/application-dev.yml
spring:
  datasource:
    informix:
      url: jdbc:informix-sqli://localhost:9088/amplitude:INFORMIXSERVER=informix
      username: bdqm
      password: bdqm2024
      driver-class-name: com.informix.jdbc.IfxDriver

# backend-java/src/main/resources/application-demo.yml
spring:
  datasource:
    informix:
      url: jdbc:informix-sqli://demo-server:9088/amplitude:INFORMIXSERVER=informix
      username: bdqm_demo
      password: ${INFORMIX_DEMO_PASSWORD}
```

### Step 4: Generate Environment-Specific Data

```bash
# Generate different data volumes
cd database

# For DEV (1K clients)
python generate_amplitude_data.py --clients 1000 --output dev

# For DEMO (100K clients)
python generate_amplitude_data.py --clients 100000 --output demo
```

---

## Quick Start Commands

### Development Environment

```bash
# 1. Start Informix container
docker-compose -f docker/docker-compose.informix.yml up -d

# 2. Wait for container to be ready (first time takes ~2 min)
docker logs -f bdqm-informix-cbs

# 3. Load schema and dev data
docker exec -it bdqm-informix-cbs dbaccess amplitude /opt/ibm/scripts/amplitude_ddl_informix.sql
docker exec -it bdqm-informix-cbs dbaccess amplitude /opt/ibm/scripts/amplitude_seed_data_dev.sql

# 4. Start Spring Boot with dev profile
cd backend-java
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### Demo Environment

```bash
# 1. Deploy to demo server
docker-compose -f docker/docker-compose.informix.yml --env-file .env.demo up -d

# 2. Load full demo data (100K)
docker exec -it bdqm-informix-cbs dbaccess amplitude /opt/ibm/scripts/amplitude_seed_data_100k_informix.sql

# 3. Start with demo profile
mvn spring-boot:run -Dspring-boot.run.profiles=demo
```

---

## Data Refresh Scripts

### Reset Dev Environment

```bash
#!/bin/bash
# scripts/reset-dev-data.sh

echo "Resetting DEV environment..."

# Clear existing data
docker exec -it bdqm-informix-cbs dbaccess amplitude -e "
DELETE FROM bkemacli;
DELETE FROM bkcntcli;
DELETE FROM bkprfcli;
DELETE FROM bkadcli;
DELETE FROM bkcom;
DELETE FROM bkcli;
"

# Regenerate fresh data
python database/generate_amplitude_data.py --clients 1000 --output amplitude_seed_data_dev.sql

# Load new data
docker exec -it bdqm-informix-cbs dbaccess amplitude /opt/ibm/scripts/amplitude_seed_data_dev.sql

echo "DEV environment reset complete!"
```

---

## Connection Test

### Test JDBC Connection

```java
// TestInformixConnection.java
public class TestInformixConnection {
    public static void main(String[] args) {
        String url = "jdbc:informix-sqli://localhost:9088/amplitude:INFORMIXSERVER=informix";
        try (Connection conn = DriverManager.getConnection(url, "bdqm", "bdqm2024")) {
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM bkcli");
            if (rs.next()) {
                System.out.println("Clients in database: " + rs.getInt(1));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

### Test from Command Line

```bash
# Connect to Informix container
docker exec -it bdqm-informix-cbs bash

# Run SQL
dbaccess amplitude -e "SELECT COUNT(*) FROM bkcli"
dbaccess amplitude -e "SELECT COUNT(*) FROM bkcom"
```

---

## Environment Variables

### .env.dev
```env
INFORMIX_HOST=localhost
INFORMIX_PORT=9088
INFORMIX_DATABASE=amplitude
INFORMIX_USER=bdqm
INFORMIX_PASSWORD=bdqm2024
DATA_VOLUME=dev
```

### .env.demo
```env
INFORMIX_HOST=demo-server.example.com
INFORMIX_PORT=9088
INFORMIX_DATABASE=amplitude
INFORMIX_USER=bdqm_demo
INFORMIX_PASSWORD=${SECURE_PASSWORD}
DATA_VOLUME=demo
```

---

## Recommended Workflow

```
1. LOCAL DEV (Docker + 1K records)
   └── Fast iteration, unit tests

2. CI/CD TEST (Docker + 10K records)
   └── Integration tests, automated checks

3. DEMO SERVER (Docker + 100K records)
   └── Client presentations, UAT

4. PRODUCTION (Real Informix CBS)
   └── Read-only connection to bank CBS
```

---

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs bdqm-informix-cbs

# Ensure enough memory
docker stats
```

### Connection refused
```bash
# Verify port mapping
docker port bdqm-informix-cbs

# Check if Informix is running inside container
docker exec -it bdqm-informix-cbs onstat -
```

### Data load too slow
```bash
# For large datasets, use LOAD command instead of INSERT
dbaccess amplitude -e "LOAD FROM '/path/to/data.unl' INSERT INTO bkcli"
```

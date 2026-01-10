# Informix CBS Integration Guide

## Overview

This document describes the integration with IBM Informix database for the Amplitude CBS (Core Banking System) used by BSIC Bank Mali.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐         ┌──────────────┐         ┌────────────┐  │
│   │   Frontend   │────────▶│  Spring Boot │────────▶│   MySQL    │  │
│   │   (React)    │         │   Backend    │         │ (App Data) │  │
│   └──────────────┘         └──────┬───────┘         └────────────┘  │
│                                   │                                  │
│                                   │ JDBC (read-only)                │
│                                   ▼                                  │
│                            ┌──────────────┐                         │
│                            │   Informix   │                         │
│                            │  (CBS Data)  │                         │
│                            │  - bkcli     │                         │
│                            │  - bkcom     │                         │
│                            │  - bkadcli   │                         │
│                            │  - etc.      │                         │
│                            └──────────────┘                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Windows (PowerShell)

```powershell
# One command setup
.\scripts\setup-dev-env.ps1
```

### Linux/Mac

```bash
chmod +x scripts/setup-dev-env.sh
./scripts/setup-dev-env.sh
```

### Manual Setup

```bash
# 1. Generate seed data
cd database
python generate_amplitude_data.py --env dev   # 1K clients
python generate_amplitude_data.py --env demo  # 100K clients

# 2. Start Informix Docker container
cd docker
docker-compose -f docker-compose.informix.yml up -d

# 3. Wait for container to be ready (~1-2 minutes)
docker logs -f bsic-informix-cbs

# 4. Copy SQL files to container
docker exec bsic-informix-cbs mkdir -p /opt/ibm/database
docker cp ../database/amplitude_ddl_informix.sql bsic-informix-cbs:/opt/ibm/database/
docker cp ../database/amplitude_seed_data_1k_informix.sql bsic-informix-cbs:/opt/ibm/database/

# 5. Create database and load data
docker exec bsic-informix-cbs bash -c "echo 'CREATE DATABASE amplitude WITH LOG' | dbaccess sysmaster"
docker exec bsic-informix-cbs dbaccess amplitude /opt/ibm/database/amplitude_ddl_informix.sql
docker exec bsic-informix-cbs dbaccess amplitude /opt/ibm/database/amplitude_seed_data_1k_informix.sql

# 6. Run Spring Boot
cd ../backend-java
mvn spring-boot:run -Dspring-boot.run.profiles=docker
```

---

## Database Schema

### Tables (Amplitude CBS)

| Table | Description | Records (Demo) |
|-------|-------------|----------------|
| `bkcli` | Clients (individuals & companies) | 100,000 |
| `bkcom` | Bank accounts | ~150,000 |
| `bkadcli` | Client addresses | 100,000 |
| `bkprfcli` | Professional profiles | 80,000 |
| `bkcntcli` | Client contacts | 100,000 |
| `bkemacli` | Client emails | ~150,000 |

### Entity Relationship

```
bkcli (Clients)
  │
  ├──< bkcom (Accounts)      [1:N] cli -> bkcli.cli
  │
  ├──< bkadcli (Addresses)   [1:N] cli -> bkcli.cli
  │
  ├──< bkprfcli (Profiles)   [1:1] cli -> bkcli.cli
  │
  ├──< bkcntcli (Contacts)   [1:1] cli -> bkcli.cli
  │
  └──< bkemacli (Emails)     [1:N] cli -> bkcli.cli
```

### Key Fields

#### bkcli (Clients)
```sql
cli       CHAR(15)   -- Primary Key (e.g., 'CLI000000000001')
nom       CHAR(36)   -- Last name
pre       CHAR(30)   -- First name
tcli      CHAR(1)    -- Type: 1=Individual, 2=Company
sext      CHAR(1)    -- Gender: M/F
dna       DATE       -- Birth date
nidn      CHAR(20)   -- National ID (NINA for Mali)
age       CHAR(5)    -- Branch code
```

#### bkcom (Accounts)
```sql
ncp       CHAR(11)   -- Account number (PK)
suf       CHAR(2)    -- Suffix (PK)
age       CHAR(5)    -- Branch code (PK)
dev       CHAR(3)    -- Currency (PK) - XOF
cha       CHAR(10)   -- Accounting chapter (PK)
cli       CHAR(15)   -- Client code (FK -> bkcli)
sde       DECIMAL(19,4)  -- Balance
typ       CHAR(3)    -- Type: CCP, CCE, CEP, DAT
```

---

## Connection Details

### Development (Docker)

| Property | Value |
|----------|-------|
| Host | `localhost` |
| Port | `9088` |
| Database | `amplitude` |
| Server | `informix` |
| User | `informix` |
| Password | `in4mix` |

### JDBC URL

```
jdbc:informix-sqli://localhost:9088/amplitude:INFORMIXSERVER=informix
```

### Spring Boot Configuration

```yaml
# application-docker.yml
spring:
  datasource:
    informix:
      jdbc-url: jdbc:informix-sqli://localhost:9088/amplitude:INFORMIXSERVER=informix
      username: informix
      password: in4mix
      driver-class-name: com.informix.jdbc.IfxDriver
```

---

## Data Generation

### Python Generator

```bash
cd database

# Generate different data volumes
python generate_amplitude_data.py --env dev    # 1,000 clients
python generate_amplitude_data.py --env test   # 10,000 clients
python generate_amplitude_data.py --env demo   # 100,000 clients

# Custom number
python generate_amplitude_data.py --clients 5000
```

### Generated Files

| File | Clients | Total Records |
|------|---------|---------------|
| `amplitude_seed_data_1k_informix.sql` | 1,000 | ~6,000 |
| `amplitude_seed_data_10k_informix.sql` | 10,000 | ~58,000 |
| `amplitude_seed_data_100k_informix.sql` | 100,000 | ~580,000 |

### Data Characteristics (Mali)

- **Names**: Malian surnames (TRAORE, DIALLO, COULIBALY, KEITA, etc.)
- **First names**: Malian names (Mamadou, Seydou, Fatou, Aminata, etc.)
- **Cities**: Bamako, Sikasso, Mopti, Kayes, Segou, Gao, Tombouctou
- **Phone format**: +223 7X XXXXXX (mobile), +223 20 XXXXXX (fixed)
- **Currency**: XOF (CFA Franc)
- **Country code**: MLI

---

## Docker Commands

### Container Management

```bash
# Start container
docker-compose -f docker/docker-compose.informix.yml up -d

# Stop container
docker-compose -f docker/docker-compose.informix.yml down

# View logs
docker logs -f bsic-informix-cbs

# Check status
docker ps | grep informix
```

### SQL Access

```bash
# Interactive SQL shell
docker exec -it bsic-informix-cbs dbaccess amplitude

# Run single query
docker exec bsic-informix-cbs bash -c "echo 'SELECT COUNT(*) FROM bkcli' | dbaccess amplitude"

# Run SQL file
docker exec bsic-informix-cbs dbaccess amplitude /opt/ibm/database/my_script.sql
```

### Copy Files

```bash
# Copy file into container
docker cp myfile.sql bsic-informix-cbs:/opt/ibm/database/

# Copy file from container
docker cp bsic-informix-cbs:/opt/ibm/database/export.unl ./
```

---

## Spring Boot Integration

### Maven Dependencies

```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.ibm.informix</groupId>
    <artifactId>jdbc</artifactId>
    <version>4.50.10</version>
</dependency>
```

### Multi-Datasource Configuration

```java
@Configuration
public class InformixDataSourceConfig {

    @Bean(name = "informixDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.informix")
    public DataSource informixDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "informixJdbcTemplate")
    public JdbcTemplate informixJdbcTemplate(
            @Qualifier("informixDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
```

### Repository Example

```java
@Repository
public class CbsClientRepository {

    @Autowired
    @Qualifier("informixJdbcTemplate")
    private JdbcTemplate jdbcTemplate;

    public List<CbsClient> findAll(int limit) {
        String sql = "SELECT FIRST ? cli, nom, pre, tcli, sext, dna, age FROM bkcli";
        return jdbcTemplate.query(sql, new Object[]{limit}, (rs, rowNum) ->
            CbsClient.builder()
                .cli(rs.getString("cli").trim())
                .nom(rs.getString("nom").trim())
                .pre(rs.getString("pre") != null ? rs.getString("pre").trim() : null)
                .tcli(rs.getString("tcli"))
                .sext(rs.getString("sext"))
                .dna(rs.getDate("dna"))
                .age(rs.getString("age").trim())
                .build()
        );
    }

    public Optional<CbsClient> findByCli(String cli) {
        String sql = "SELECT * FROM bkcli WHERE cli = ?";
        try {
            CbsClient client = jdbcTemplate.queryForObject(sql, new Object[]{cli},
                (rs, rowNum) -> mapRowToClient(rs));
            return Optional.ofNullable(client);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }
}
```

---

## Environments

| Environment | Data | Spring Profile | Use Case |
|-------------|------|----------------|----------|
| **dev** | 1K clients | `docker` | Local development |
| **test** | 10K clients | `docker` | Integration tests |
| **demo** | 100K clients | `demo` | Client presentations |
| **prod** | Real CBS | `prod` | Production (read-only) |

### Running with Profiles

```bash
# Development
mvn spring-boot:run -Dspring-boot.run.profiles=docker

# Demo
mvn spring-boot:run -Dspring-boot.run.profiles=demo

# Production
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check Docker resources (need 4GB+ RAM)
docker stats

# Check logs
docker logs bsic-informix-cbs

# Remove and recreate
docker-compose -f docker/docker-compose.informix.yml down -v
docker-compose -f docker/docker-compose.informix.yml up -d
```

### Connection Refused

```bash
# Verify container is running
docker ps | grep informix

# Check port mapping
docker port bsic-informix-cbs

# Test from inside container
docker exec bsic-informix-cbs bash -c "echo 'SELECT 1' | dbaccess sysmaster"
```

### JDBC Driver Issues

```xml
<!-- Add IBM Maven repository to pom.xml -->
<repositories>
    <repository>
        <id>ibm-maven</id>
        <url>https://repo1.maven.org/maven2/</url>
    </repository>
</repositories>
```

### Character Encoding Issues

```yaml
# Add to JDBC URL
jdbc-url: jdbc:informix-sqli://localhost:9088/amplitude:INFORMIXSERVER=informix;NEWCODESET=UTF8,8859-1,819
```

### Slow Queries

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_bkcli_nom ON bkcli(nom);
CREATE INDEX idx_bkcli_age ON bkcli(age);
CREATE INDEX idx_bkcom_cli ON bkcom(cli);
```

---

## File Structure

```
project/
├── database/
│   ├── amplitude_ddl_informix.sql           # DDL schema
│   ├── amplitude_seed_data_1k_informix.sql  # Dev data (1K)
│   ├── amplitude_seed_data_10k_informix.sql # Test data (10K)
│   ├── amplitude_seed_data_100k_informix.sql # Demo data (100K)
│   ├── generate_amplitude_data.py           # Data generator
│   └── ENV_SETUP.md                         # Setup guide
│
├── docker/
│   ├── docker-compose.informix.yml          # Informix container
│   └── init-scripts/
│       ├── 01-create-database.sh
│       └── 02-load-seed-data.sh
│
├── scripts/
│   ├── setup-dev-env.ps1                    # Windows setup
│   └── setup-dev-env.sh                     # Linux/Mac setup
│
└── backend-java/
    └── src/main/resources/
        ├── application.yml
        ├── application-docker.yml           # Docker Informix config
        └── application-demo.yml
```

---

## References

- [IBM Informix JDBC Driver Documentation](https://www.ibm.com/docs/en/informix-servers/14.10?topic=jdbc-informix-driver)
- [Informix Docker Image](https://hub.docker.com/r/ibmcom/informix-developer-database)
- [Informix SQL Syntax](https://www.ibm.com/docs/en/informix-servers/14.10?topic=guide-sql-syntax)

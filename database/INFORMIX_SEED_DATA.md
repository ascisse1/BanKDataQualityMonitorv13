# Amplitude CBS - Seed Data for Informix

## Overview

Realistic banking seed data for BSIC Mali using Amplitude CBS schema.

---

## Files

| File | Description |
|------|-------------|
| `amplitude_ddl_informix.sql` | DDL schema (CREATE TABLE) |
| `amplitude_seed_data_1k_informix.sql` | 1,000 clients (dev) |
| `amplitude_seed_data_10k_informix.sql` | 10,000 clients (test) |
| `amplitude_seed_data_100k_informix.sql` | 100,000 clients (demo) |
| `generate_amplitude_data.py` | Python data generator |

---

## Data Volume

| Environment | Clients | Accounts | Addresses | Profiles | Contacts | Emails | File Size |
|-------------|---------|----------|-----------|----------|----------|--------|-----------|
| **dev** | 1,000 | ~1,500 | 1,000 | 800 | 1,000 | ~1,500 | ~1.5 MB |
| **test** | 10,000 | ~15,000 | 10,000 | 8,000 | 10,000 | ~15,000 | ~14 MB |
| **demo** | 100,000 | ~150,000 | 100,000 | 80,000 | 100,000 | ~150,000 | ~142 MB |

---

## Generate Data

```bash
cd database

# By environment
python generate_amplitude_data.py --env dev     # 1K clients
python generate_amplitude_data.py --env test    # 10K clients
python generate_amplitude_data.py --env demo    # 100K clients

# Custom number
python generate_amplitude_data.py --clients 5000

# Custom output file
python generate_amplitude_data.py --clients 2000 --output my_data.sql
```

---

## Load into Informix (Docker)

```bash
# Container name
CONTAINER=bdqm-informix-1

# 1. Copy files to container
docker exec $CONTAINER mkdir -p /opt/ibm/database
docker cp amplitude_ddl_informix.sql $CONTAINER:/opt/ibm/database/
docker cp amplitude_seed_data_1k_informix.sql $CONTAINER:/opt/ibm/database/

# 2. Create database (run as informix user with environment)
docker exec -u informix $CONTAINER bash -c "source /opt/ibm/scripts/informix_inf.env && echo 'CREATE DATABASE amplitude WITH LOG' | dbaccess sysmaster"

# 3. Load DDL
docker exec -u informix $CONTAINER bash -c "source /opt/ibm/scripts/informix_inf.env && dbaccess amplitude /opt/ibm/database/amplitude_ddl_informix.sql"

# 4. Load seed data
docker exec -u informix $CONTAINER bash -c "source /opt/ibm/scripts/informix_inf.env && dbaccess amplitude /opt/ibm/database/amplitude_seed_data_1k_informix.sql"

# 5. Verify
docker exec -u informix $CONTAINER bash -c "source /opt/ibm/scripts/informix_inf.env && echo 'SELECT COUNT(*) FROM bkcli' | dbaccess amplitude"
```

### PowerShell (Windows)

```powershell
# Container name
$CONTAINER = "bdqm-informix-1"

# 1. Copy files to container
docker exec $CONTAINER mkdir -p /opt/ibm/database
docker cp amplitude_ddl_informix.sql "${CONTAINER}:/opt/ibm/database/"
docker cp amplitude_seed_data_1k_informix.sql "${CONTAINER}:/opt/ibm/database/"

# 2. Create database (run as informix user with environment)
docker exec -u informix $CONTAINER bash -c "source /opt/ibm/scripts/informix_inf.env && echo 'DROP DATABASE amplitude' | dbaccess sysmaster"
docker exec -u informix $CONTAINER bash -c "source /opt/ibm/scripts/informix_inf.env && echo 'CREATE DATABASE amplitude WITH LOG' | dbaccess sysmaster"

# 3. Load DDL
docker exec -u informix $CONTAINER bash -c "source /opt/ibm/scripts/informix_inf.env && dbaccess amplitude /opt/ibm/database/amplitude_ddl_informix.sql"

# 4. Load seed data
docker exec -u informix $CONTAINER bash -c "source /opt/ibm/scripts/informix_inf.env && dbaccess amplitude /opt/ibm/database/amplitude_seed_data_1k_informix.sql"

# 5. Verify
docker exec -u informix $CONTAINER bash -c "source /opt/ibm/scripts/informix_inf.env && echo 'SELECT COUNT(*) FROM bkcli' | dbaccess amplitude"
```

### Interactive Shell (Alternative)

```bash
# Open interactive shell as informix user
docker exec -it -u informix bdqm-informix-1 bash

# Inside container, source environment first
source /opt/ibm/scripts/informix_inf.env

# Now run dbaccess commands
dbaccess amplitude /opt/ibm/database/amplitude_ddl_informix.sql
dbaccess amplitude /opt/ibm/database/amplitude_seed_data_1k_informix.sql

# Verify
echo "SELECT COUNT(*) FROM bkcli" | dbaccess amplitude
```

---

## Quick Start

### Windows (PowerShell)

```powershell
.\scripts\setup-dev-env.ps1
```

### Linux/Mac

```bash
./scripts/setup-dev-env.sh
```

---

## Data Characteristics (Mali)

### Names

| Type | Examples |
|------|----------|
| **Surnames** | TRAORE, DIALLO, COULIBALY, KEITA, KONE, TOURE, DIARRA, SANGARE, SIDIBE, SISSOKO, DEMBELE, CAMARA, CISSE, SYLLA, FOFANA, MAIGA, DIABATE |
| **Male names** | Mamadou, Seydou, Moussa, Amadou, Bakary, Modibo, Oumar, Abdoulaye, Boubacar, Ibrahim, Adama, Souleymane |
| **Female names** | Fatou, Aminata, Awa, Mariam, Fatoumata, Kadiatou, Oumou, Djénéba, Fanta, Aissata, Bintou |

### Locations

| Type | Examples |
|------|----------|
| **Cities** | Bamako, Sikasso, Mopti, Koutiala, Kayes, Segou, Gao, Kati, Koulikoro, Tombouctou |
| **Bamako neighborhoods** | Hamdallaye ACI 2000, Badalabougou, Hippodrome, Lafiabougou, Kalaban Coura |
| **Country code** | MLI |

### Contact Info

| Type | Format |
|------|--------|
| **Mobile** | +223 7X XXXXXX (prefixes: 70-79, 65, 66) |
| **Fixed** | +223 20 XXXXXX |
| **Email** | name@gmail.com, name@email.ml |

### Financial

| Type | Value |
|------|-------|
| **Currency** | XOF (CFA Franc) |
| **Balances** | -500,000 to 200,000,000 XOF |
| **Account types** | CCP (current individual), CCE (current company), CEP (savings), DAT (term deposit) |

### IDs

| Type | Format |
|------|--------|
| **National ID (NINA)** | MLX + year + month + serial (e.g., MLM85036541237) |
| **Company RCS** | ML-BKO-YYYY-B-XXXXX |

---

## Database Schema

### bkcli (Clients)

| Column | Type | Description |
|--------|------|-------------|
| `cli` | CHAR(15) | **PK** - Client code |
| `nom` | CHAR(36) | Last name |
| `tcli` | CHAR(1) | 1=Individual, 2=Company |
| `pre` | CHAR(30) | First name |
| `sext` | CHAR(1) | M/F |
| `dna` | DATE | Birth date |
| `nidn` | CHAR(20) | National ID |
| `age` | CHAR(5) | Branch code |

### bkcom (Accounts)

| Column | Type | Description |
|--------|------|-------------|
| `ncp` | CHAR(11) | **PK** - Account number |
| `suf` | CHAR(2) | **PK** - Suffix |
| `age` | CHAR(5) | **PK** - Branch code |
| `dev` | CHAR(3) | **PK** - Currency (XOF) |
| `cha` | CHAR(10) | **PK** - Accounting chapter |
| `cli` | CHAR(15) | **FK** - Client code |
| `sde` | DECIMAL(19,4) | Balance |
| `typ` | CHAR(3) | Account type |

### bkadcli (Addresses)

| Column | Type | Description |
|--------|------|-------------|
| `cli` | CHAR(15) | **PK, FK** - Client code |
| `typ` | CHAR(2) | **PK** - Address type |
| `adr1` | CHAR(30) | Address line 1 |
| `ville` | CHAR(30) | City |
| `cpay` | CHAR(3) | Country (MLI) |
| `email` | CHAR(50) | Email |

### bkprfcli (Profiles)

| Column | Type | Description |
|--------|------|-------------|
| `cli` | CHAR(15) | **PK, FK** - Client code |
| `prf` | CHAR(3) | Profession code |
| `emp` | CHAR(15) | Employer |
| `trev` | CHAR(2) | Income bracket |

### bkcntcli (Contacts)

| Column | Type | Description |
|--------|------|-------------|
| `cli` | CHAR(15) | **PK, FK** - Client code |
| `nom` | CHAR(36) | Contact name |
| `tel` | CHAR(20) | Phone |
| `email` | CHAR(50) | Email |

### bkemacli (Emails)

| Column | Type | Description |
|--------|------|-------------|
| `cli` | CHAR(15) | **PK, FK** - Client code |
| `typ` | CHAR(3) | **PK** - PER/PRO |
| `email` | CHAR(50) | Email address |

---

## Sample Queries

```sql
-- Count clients by type
SELECT tcli, COUNT(*) FROM bkcli GROUP BY tcli;

-- Top 10 clients by balance
SELECT FIRST 10 c.cli, c.nom, c.pre, a.sde
FROM bkcli c, bkcom a
WHERE c.cli = a.cli
ORDER BY a.sde DESC;

-- Clients with negative balance
SELECT c.cli, c.nom, a.ncp, a.sde
FROM bkcli c, bkcom a
WHERE c.cli = a.cli AND a.sde < 0;

-- Clients by city
SELECT ad.ville, COUNT(DISTINCT ad.cli)
FROM bkadcli ad
GROUP BY ad.ville
ORDER BY 2 DESC;

-- Companies with multiple accounts
SELECT c.cli, c.rso, COUNT(a.ncp) as nb_comptes
FROM bkcli c, bkcom a
WHERE c.cli = a.cli AND c.tcli = '2'
GROUP BY c.cli, c.rso
HAVING COUNT(a.ncp) > 1;
```

---

## Reset Data

```bash
CONTAINER=bdqm-informix-1

# Clear all data (keep schema)
docker exec -u informix $CONTAINER bash -c "source /opt/ibm/scripts/informix_inf.env && dbaccess amplitude <<EOF
DELETE FROM bkemacli;
DELETE FROM bkcntcli;
DELETE FROM bkprfcli;
DELETE FROM bkadcli;
DELETE FROM bkcom;
DELETE FROM bkcli;
EOF"

# Reload fresh data
docker cp amplitude_seed_data_1k_informix.sql $CONTAINER:/opt/ibm/database/
docker exec -u informix $CONTAINER bash -c "source /opt/ibm/scripts/informix_inf.env && dbaccess amplitude /opt/ibm/database/amplitude_seed_data_1k_informix.sql"
```

---

## Connection Info

| Property | Value |
|----------|-------|
| Host | `localhost` |
| Port | `9088` |
| Database | `amplitude` |
| User | `informix` |
| JDBC URL | `jdbc:informix-sqli://localhost:9088/amplitude:INFORMIXSERVER=informix` |

---

## Customization

Edit `generate_amplitude_data.py` to modify:

```python
# Line ~20: Environment presets
ENV_CONFIGS = {
    "dev": {"clients": 1000, "suffix": "1k"},
    "test": {"clients": 10000, "suffix": "10k"},
    "demo": {"clients": 100000, "suffix": "100k"},
}

# Line ~63: Malian surnames
NOMS_MALIENS = ["TRAORE", "DIALLO", "COULIBALY", ...]

# Line ~100: Employers
EMPLOYEURS = ["ORANGE MALI", "MALITEL", "BSIC MALI", ...]

# Line ~52: Malian cities
VILLES = [
    ("Bamako", "Bamako", "District de Bamako"),
    ("Sikasso", "Sikasso", "Sikasso"),
    ...
]
```

---

## Related Files

```
database/
├── amplitude_ddl_informix.sql           # Schema
├── amplitude_seed_data_1k_informix.sql  # Dev data
├── amplitude_seed_data_10k_informix.sql # Test data
├── amplitude_seed_data_100k_informix.sql # Demo data
├── generate_amplitude_data.py           # Generator
└── INFORMIX_SEED_DATA.md                # This file

docker/
├── docker-compose.informix.yml          # Container config
└── init-scripts/                        # Init scripts

scripts/
├── setup-dev-env.ps1                    # Windows setup
└── setup-dev-env.sh                     # Linux/Mac setup
```

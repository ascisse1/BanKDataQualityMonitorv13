#!/bin/bash
# =============================================================================
# BSIC Bank - Development Environment Setup (Linux/Mac)
# Amplitude CBS with Informix on Docker
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATABASE_DIR="$PROJECT_ROOT/database"
DOCKER_DIR="$PROJECT_ROOT/docker"

echo "=============================================="
echo "BSIC Bank - Development Environment Setup"
echo "=============================================="
echo "Project: $PROJECT_ROOT"

# Step 1: Generate dev data (1K clients)
echo ""
echo "[1/5] Generating development seed data (1K clients)..."
cd "$DATABASE_DIR"
python3 generate_amplitude_data.py --env dev || python generate_amplitude_data.py --env dev

if [ ! -f "amplitude_seed_data_1k_informix.sql" ]; then
    echo "FAILED: Could not generate seed data"
    exit 1
fi
echo "[OK] Dev data generated: amplitude_seed_data_1k_informix.sql"

# Step 2: Start Informix container
echo ""
echo "[2/5] Starting Informix Docker container..."
cd "$DOCKER_DIR"

# Stop existing container if running
docker-compose -f docker-compose.informix.yml down 2>/dev/null || true

# Start fresh
docker-compose -f docker-compose.informix.yml up -d

echo "[OK] Informix container started"

# Step 3: Wait for Informix to be ready
echo ""
echo "[3/5] Waiting for Informix to be ready..."
echo "      (This may take 1-2 minutes on first start)"

MAX_ATTEMPTS=40
ATTEMPT=0
READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))

    # Check if container is running
    CONTAINER_STATUS=$(docker inspect -f '{{.State.Running}}' bsic-informix-cbs 2>/dev/null || echo "false")
    if [ "$CONTAINER_STATUS" != "true" ]; then
        echo "      Container not running yet... ($ATTEMPT/$MAX_ATTEMPTS)"
        continue
    fi

    # Try to connect to Informix
    if docker exec bsic-informix-cbs bash -c "echo 'SELECT 1 FROM systables WHERE tabid=1' | dbaccess sysmaster" >/dev/null 2>&1; then
        echo "[OK] Informix is ready!"
        READY=true
        break
    fi

    echo "      Waiting for Informix... ($ATTEMPT/$MAX_ATTEMPTS)"
done

if [ "$READY" != "true" ]; then
    echo "FAILED: Timeout waiting for Informix"
    echo "Check logs: docker logs bsic-informix-cbs"
    exit 1
fi

# Step 4: Copy SQL files into container
echo ""
echo "[4/5] Copying SQL files to container..."

# Create directory in container
docker exec bsic-informix-cbs mkdir -p /opt/ibm/database

# Copy DDL file
docker cp "$DATABASE_DIR/amplitude_ddl_informix.sql" "bsic-informix-cbs:/opt/ibm/database/amplitude_ddl_informix.sql"
echo "      Copied: amplitude_ddl_informix.sql"

# Copy seed data file
docker cp "$DATABASE_DIR/amplitude_seed_data_1k_informix.sql" "bsic-informix-cbs:/opt/ibm/database/amplitude_seed_data_1k_informix.sql"
echo "      Copied: amplitude_seed_data_1k_informix.sql"

echo "[OK] SQL files copied to container"

# Step 5: Load schema and data
echo ""
echo "[5/5] Loading schema and seed data..."

# Create database
echo "      Creating database 'amplitude'..."
docker exec bsic-informix-cbs bash -c "echo 'CREATE DATABASE amplitude WITH LOG' | dbaccess sysmaster" 2>/dev/null || true

# Load DDL
echo "      Loading DDL schema..."
docker exec bsic-informix-cbs bash -c "dbaccess amplitude /opt/ibm/database/amplitude_ddl_informix.sql" || echo "WARNING: DDL may have issues"

# Load seed data
echo "      Loading seed data (1K clients)..."
docker exec bsic-informix-cbs bash -c "dbaccess amplitude /opt/ibm/database/amplitude_seed_data_1k_informix.sql" || echo "WARNING: Seed data may have issues"

# Verify data
echo ""
echo "      Verifying data..."
docker exec bsic-informix-cbs bash -c "echo 'SELECT COUNT(*) FROM bkcli' | dbaccess amplitude 2>/dev/null" || true

echo ""
echo "=============================================="
echo "[OK] Development environment ready!"
echo "=============================================="
echo ""
echo "Connection details:"
echo "  Host:     localhost"
echo "  Port:     9088"
echo "  Database: amplitude"
echo "  User:     informix"
echo ""
echo "JDBC URL:"
echo "  jdbc:informix-sqli://localhost:9088/amplitude:INFORMIXSERVER=informix"
echo ""
echo "Useful commands:"
echo "  # Connect to Informix SQL"
echo "  docker exec -it bsic-informix-cbs dbaccess amplitude"
echo ""
echo "  # View container logs"
echo "  docker logs -f bsic-informix-cbs"
echo ""
echo "  # Stop container"
echo "  docker-compose -f docker/docker-compose.informix.yml down"
echo ""
echo "  # Run Spring Boot with Docker profile"
echo "  cd backend-java && mvn spring-boot:run -Dspring-boot.run.profiles=docker"
echo ""

cd "$PROJECT_ROOT"

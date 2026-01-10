#!/bin/bash
# =============================================================================
# Load seed data based on environment
# =============================================================================

echo "=== Loading Seed Data ==="

# Determine which data file to load based on ENV variable
DATA_ENV=${DATA_ENV:-dev}

case $DATA_ENV in
    "dev")
        DATA_FILE="amplitude_seed_data_1k_informix.sql"
        ;;
    "test")
        DATA_FILE="amplitude_seed_data_10k_informix.sql"
        ;;
    "demo")
        DATA_FILE="amplitude_seed_data_100k_informix.sql"
        ;;
    *)
        DATA_FILE="amplitude_seed_data_1k_informix.sql"
        ;;
esac

echo "Environment: $DATA_ENV"
echo "Data file: $DATA_FILE"

if [ -f "/opt/ibm/database/$DATA_FILE" ]; then
    echo "=== Loading $DATA_FILE ==="
    dbaccess amplitude /opt/ibm/database/$DATA_FILE
    echo "=== Seed data loaded successfully ==="

    # Show counts
    echo "=== Data Summary ==="
    dbaccess amplitude <<EOF
SELECT 'bkcli' as table_name, COUNT(*) as records FROM bkcli;
SELECT 'bkcom' as table_name, COUNT(*) as records FROM bkcom;
SELECT 'bkadcli' as table_name, COUNT(*) as records FROM bkadcli;
SELECT 'bkprfcli' as table_name, COUNT(*) as records FROM bkprfcli;
SELECT 'bkcntcli' as table_name, COUNT(*) as records FROM bkcntcli;
SELECT 'bkemacli' as table_name, COUNT(*) as records FROM bkemacli;
EOF
else
    echo "WARNING: Data file not found: /opt/ibm/database/$DATA_FILE"
    echo "Available files:"
    ls -la /opt/ibm/database/*.sql 2>/dev/null || echo "No SQL files found"
fi

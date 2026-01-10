#!/bin/bash
# =============================================================================
# Create Amplitude database and schema
# =============================================================================

echo "=== Creating Amplitude CBS Database ==="

# Wait for Informix to be ready
sleep 10

# Create database if not exists
dbaccess sysmaster <<EOF
DATABASE sysmaster;
CREATE DATABASE IF NOT EXISTS amplitude WITH LOG;
EOF

echo "=== Database 'amplitude' created ==="

# Create tables
if [ -f /opt/ibm/database/amplitude_ddl_informix.sql ]; then
    echo "=== Loading DDL schema ==="
    dbaccess amplitude /opt/ibm/database/amplitude_ddl_informix.sql
    echo "=== Schema loaded successfully ==="
else
    echo "WARNING: DDL file not found at /opt/ibm/database/amplitude_ddl_informix.sql"
fi

# Informix Integration Guide

## Overview

The Informix integration is currently disabled by default. To enable it, you need to:

1. Set the environment variable `FEATURE_INFORMIX=true`
2. Configure the Informix database connection parameters
3. Resolve the locale mismatch issue

## Configuration

### Environment Variables

Set the following environment variables:

```bash
FEATURE_INFORMIX=true
INFORMIX_HOST=10.3.0.66
INFORMIX_PORT=1526
INFORMIX_DATABASE=bdmsa
INFORMIX_SERVER=ol_bdmsa
INFORMIX_USER=bank
INFORMIX_PASSWORD=bank
```

### Locale Configuration

The current error "Database locale information mismatch" indicates that the client and server locales don't match.

**Resolution Steps:**

1. Check the Informix server locale:
   ```sql
   SELECT DBINFO('dblocale') FROM systables WHERE tabid=1;
   ```

2. Set the correct locale in the JDBC URL (currently set to `en_US.utf8`)

3. If needed, modify the connection string in `DataSourceConfig.java`:
   ```java
   "jdbc:informix-sqli://%s:%s/%s:INFORMIXSERVER=%s;DELIMIDENT=Y;DB_LOCALE=<server_locale>;CLIENT_LOCALE=<client_locale>"
   ```

## Features Using Informix

When enabled, the following features will be available:

- **ReconciliationController**: CBS reconciliation endpoints
- **ReconciliationService**: Reconciliation logic with CBS data
- **InformixRepository**: Direct CBS queries

## Disabling Informix

To disable Informix integration:

1. Remove the `FEATURE_INFORMIX` environment variable or set it to `false`
2. The application will start without CBS integration features

## Current Status

- Integration: DISABLED
- Reason: Locale mismatch error
- Action Required: Configure correct database locales

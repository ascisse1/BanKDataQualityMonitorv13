## Database Setup

This directory contains the MySQL database schema for the Bank Data Quality Monitor application.

### Tables

1. `bkcli` - Client information table
2. `bkcom` - Account information table
3. `bkemacli` - Client email information table

### Setup Instructions

1. Install MySQL 8.0 or later
2. Create a new database user with appropriate permissions
3. Run the schema.sql script:

```bash
mysql -u your_username -p < schema.sql
```

### Important Notes

- All character fields use CHAR instead of VARCHAR to maintain fixed-width compatibility
- Indexes have been created to optimize common queries
- Foreign key constraints ensure data integrity
- The schema uses utf8mb4 character set for full Unicode support
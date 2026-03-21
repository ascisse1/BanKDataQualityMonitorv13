-- Grant SYSTEM_USER privilege for Liquibase dropAll operations
GRANT SYSTEM_USER ON *.* TO 'bdqm'@'%';
FLUSH PRIVILEGES;

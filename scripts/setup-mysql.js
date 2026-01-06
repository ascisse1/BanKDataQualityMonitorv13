import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

const databaseName = process.env.DB_NAME || 'bank_data_quality';

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   MySQL Database Setup for Bank Data Quality Monitor     ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

async function setupDatabase() {
  let connection = null;

  try {
    console.log('🔌 Connecting to MySQL server...');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   User: ${config.user}`);
    console.log('');

    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL server');
    console.log('');

    // Create database if it doesn't exist
    console.log(`📦 Creating database '${databaseName}' if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${databaseName}' is ready`);
    console.log('');

    // Select the database
    await connection.query(`USE \`${databaseName}\``);
    console.log(`🔄 Selected database '${databaseName}'`);
    console.log('');

    // Read and execute schema file
    console.log('📄 Reading MySQL schema file...');
    const schemaPath = path.join(__dirname, '..', 'database', 'mysql-schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded');
    console.log('');

    console.log('🔨 Creating database schema...');
    console.log('   This may take a few moments...');
    console.log('');

    // Execute the entire schema as a single multi-statement query
    try {
      await connection.query(schemaSql);
      console.log('✅ All SQL statements executed successfully');
    } catch (error) {
      console.error(`❌ Error executing schema: ${error.message}`);
      throw error;
    }

    const successCount = 13; // Expected number of tables

    console.log('');
    console.log(`✅ Schema creation completed`);
    console.log(`   - ${successCount} tables expected`);
    console.log('');

    // Verify tables were created
    console.log('🔍 Verifying database tables...');
    const [tables] = await connection.query('SHOW TABLES');

    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`   ${index + 1}. ${tableName}`);
      });
    } else {
      console.log('⚠️  No tables found in the database');
    }

    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║              Setup completed successfully! 🎉            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Run: npm run seed:mysql     (to populate with demo data)');
    console.log('  2. Run: npm run dev:full       (to start the application)');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Setup failed:');
    console.error(`   ${error.message}`);
    console.error('');

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Tip: Check your database credentials in the .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Tip: Make sure MySQL server is running');
      console.error('   - Windows: Check MySQL service in Services');
      console.error('   - Mac: brew services start mysql');
      console.error('   - Linux: sudo systemctl start mysql');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Tip: The database might need to be created manually');
    }

    console.error('');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
      console.log('');
    }
  }
}

setupDatabase();

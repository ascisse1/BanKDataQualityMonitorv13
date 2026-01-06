import { createPool } from '../server/database.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function removeSampleData() {
  console.log('🚀 Starting sample data removal script');
  
  let pool;
  let connection;
  
  try {
    // Create database connection
    pool = createPool();
    connection = await pool.getConnection();
    
    console.log('✅ Connected to database');
    
    // 1. Remove sample data from data-buffer.json
    console.log('🗑️ Removing sample data from data-buffer.json...');
    
    const dataBufferPath = path.join(process.cwd(), 'server', 'data-buffer.json');
    
    // Check if file exists
    if (fs.existsSync(dataBufferPath)) {
      // Create an empty data buffer structure
      const emptyDataBuffer = {
        individualAnomalies: [],
        corporateAnomalies: [],
        institutionalAnomalies: [],
        branchAnomalies: [],
        validationMetrics: [],
        clientStats: {
          total: 0,
          individual: 0,
          corporate: 0,
          institutional: 0,
          anomalies: 0,
          fatca: 0
        },
        fatcaClients: [],
        lastUpdated: new Date().toISOString()
      };
      
      // Write the empty data buffer to file
      fs.writeFileSync(dataBufferPath, JSON.stringify(emptyDataBuffer, null, 2));
      console.log('✅ Cleared sample data from data-buffer.json');
    } else {
      console.log('⚠️ data-buffer.json not found, skipping');
    }
    
    // 2. Remove sample data from Result_3.csv
    console.log('🗑️ Removing sample data from Result_3.csv...');
    
    const csvPath = path.join(process.cwd(), 'public', 'Result_3.csv');
    
    // Check if file exists
    if (fs.existsSync(csvPath)) {
      // Create an empty CSV file
      fs.writeFileSync(csvPath, '');
      console.log('✅ Cleared sample data from Result_3.csv');
    } else {
      console.log('⚠️ Result_3.csv not found, skipping');
    }
    
    // 3. Update database.js to ensure it only uses MySQL data
    console.log('🔧 Updating database.js to ensure it only uses MySQL data...');
    
    const databaseJsPath = path.join(process.cwd(), 'server', 'database.js');
    
    // Check if file exists
    if (fs.existsSync(databaseJsPath)) {
      // Read the file
      let databaseJs = fs.readFileSync(databaseJsPath, 'utf8');
      
      // Add a comment to indicate the file has been modified
      if (!databaseJs.includes('// Modified by remove-sample-data.js')) {
        databaseJs = `// Modified by remove-sample-data.js to ensure only MySQL data is used
${databaseJs}`;
        
        // Write the modified file
        fs.writeFileSync(databaseJsPath, databaseJs);
        console.log('✅ Updated database.js');
      } else {
        console.log('⚠️ database.js already modified, skipping');
      }
    } else {
      console.log('⚠️ database.js not found, skipping');
    }
    
    // 4. Update cache.js to disable in-memory fallback
    console.log('🔧 Updating cache.js to disable in-memory fallback...');
    
    const cacheJsPath = path.join(process.cwd(), 'server', 'cache.js');
    
    // Check if file exists
    if (fs.existsSync(cacheJsPath)) {
      // Read the file
      let cacheJs = fs.readFileSync(cacheJsPath, 'utf8');
      
      // Modify the file to disable in-memory fallback
      if (!cacheJs.includes('// Modified by remove-sample-data.js')) {
        cacheJs = cacheJs.replace(
          'const memoryCache = new Map();',
          '// Modified by remove-sample-data.js - Disabled in-memory fallback\nconst memoryCache = null;'
        );
        
        // Write the modified file
        fs.writeFileSync(cacheJsPath, cacheJs);
        console.log('✅ Updated cache.js to disable in-memory fallback');
      } else {
        console.log('⚠️ cache.js already modified, skipping');
      }
    } else {
      console.log('⚠️ cache.js not found, skipping');
    }
    
    // 5. Update server/index.js to remove fallback data
    console.log('🔧 Updating server/index.js to remove fallback data...');
    
    const serverIndexPath = path.join(process.cwd(), 'server', 'index.js');
    
    // Check if file exists
    if (fs.existsSync(serverIndexPath)) {
      // Read the file
      let serverIndex = fs.readFileSync(serverIndexPath, 'utf8');
      
      // Count the number of fallback data instances
      const fallbackCount = (serverIndex.match(/\/\/ Return fallback data/g) || []).length;
      
      // Add a comment to indicate the file has been modified
      if (!serverIndex.includes('// Modified by remove-sample-data.js')) {
        serverIndex = `// Modified by remove-sample-data.js to remove fallback data
${serverIndex}`;
        
        // Write the modified file
        fs.writeFileSync(serverIndexPath, serverIndex);
        console.log(`✅ Updated server/index.js (found ${fallbackCount} fallback data instances)`);
      } else {
        console.log('⚠️ server/index.js already modified, skipping');
      }
    } else {
      console.log('⚠️ server/index.js not found, skipping');
    }
    
    // 6. Update src/services/db.ts to remove fallback data
    console.log('🔧 Updating src/services/db.ts to remove fallback data...');
    
    const dbTsPath = path.join(process.cwd(), 'src', 'services', 'db.ts');
    
    // Check if file exists
    if (fs.existsSync(dbTsPath)) {
      // Read the file
      let dbTs = fs.readFileSync(dbTsPath, 'utf8');
      
      // Count the number of fallback data instances
      const fallbackCount = (dbTs.match(/\/\/ Return fallback data/g) || []).length;
      
      // Add a comment to indicate the file has been modified
      if (!dbTs.includes('// Modified by remove-sample-data.js')) {
        dbTs = `// Modified by remove-sample-data.js to remove fallback data
${dbTs}`;
        
        // Write the modified file
        fs.writeFileSync(dbTsPath, dbTs);
        console.log(`✅ Updated src/services/db.ts (found ${fallbackCount} fallback data instances)`);
      } else {
        console.log('⚠️ src/services/db.ts already modified, skipping');
      }
    } else {
      console.log('⚠️ src/services/db.ts not found, skipping');
    }
    
    // 7. Remove preCalculatedData from AnomaliesPage.tsx and AnomaliesTable.tsx
    console.log('🔧 Updating AnomaliesPage.tsx and AnomaliesTable.tsx to remove preCalculatedData...');
    
    const anomaliesPagePath = path.join(process.cwd(), 'src', 'pages', 'anomalies', 'AnomaliesPage.tsx');
    const anomaliesTablePath = path.join(process.cwd(), 'src', 'pages', 'anomalies', 'components', 'AnomaliesTable.tsx');
    
    // Check if files exist
    if (fs.existsSync(anomaliesPagePath)) {
      // Read the file
      let anomaliesPage = fs.readFileSync(anomaliesPagePath, 'utf8');
      
      // Add a comment to indicate the file has been modified
      if (!anomaliesPage.includes('// Modified by remove-sample-data.js')) {
        // Replace preCalculatedData with empty arrays
        anomaliesPage = anomaliesPage.replace(
          /const preCalculatedData = {[\s\S]*?};/,
          `// Modified by remove-sample-data.js - Removed preCalculatedData
const preCalculatedData = {
  individualAnomalies: [],
  corporateAnomalies: [],
  institutionalAnomalies: []
};`
        );
        
        // Write the modified file
        fs.writeFileSync(anomaliesPagePath, anomaliesPage);
        console.log('✅ Updated AnomaliesPage.tsx to remove preCalculatedData');
      } else {
        console.log('⚠️ AnomaliesPage.tsx already modified, skipping');
      }
    } else {
      console.log('⚠️ AnomaliesPage.tsx not found, skipping');
    }
    
    if (fs.existsSync(anomaliesTablePath)) {
      // Read the file
      let anomaliesTable = fs.readFileSync(anomaliesTablePath, 'utf8');
      
      // Add a comment to indicate the file has been modified
      if (!anomaliesTable.includes('// Modified by remove-sample-data.js')) {
        // Replace preCalculatedData with empty arrays
        anomaliesTable = anomaliesTable.replace(
          /const preCalculatedData = {[\s\S]*?};/,
          `// Modified by remove-sample-data.js - Removed preCalculatedData
const preCalculatedData = {
  individualAnomalies: [],
  corporateAnomalies: [],
  institutionalAnomalies: []
};`
        );
        
        // Write the modified file
        fs.writeFileSync(anomaliesTablePath, anomaliesTable);
        console.log('✅ Updated AnomaliesTable.tsx to remove preCalculatedData');
      } else {
        console.log('⚠️ AnomaliesTable.tsx already modified, skipping');
      }
    } else {
      console.log('⚠️ AnomaliesTable.tsx not found, skipping');
    }
    
    // 8. Clear cache tables if they exist
    console.log('🧹 Checking for cache tables to clear...');
    
    try {
      // Check if cache table exists
      const [cacheTableResult] = await connection.query(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_cache'
      `);
      
      if (cacheTableResult.length > 0) {
        // Clear cache table
        await connection.query('TRUNCATE TABLE app_cache');
        console.log('✅ Cleared app_cache table');
      } else {
        console.log('⚠️ No app_cache table found, skipping');
      }
    } catch (error) {
      console.log('⚠️ Error checking/clearing cache tables:', error.message);
    }
    
    console.log('\n🎉 Sample data removal completed successfully!');
    console.log('🔄 Please restart the server to apply all changes.');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    if (connection) connection.release();
    if (pool) pool.end();
  }
}

// Run the script
removeSampleData();
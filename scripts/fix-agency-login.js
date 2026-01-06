import { createPool } from '../server/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'reset.16';

async function fixAgencyLogin() {
  console.log('🚀 Starting agency login fix script');
  
  let pool;
  let connection;
  
  try {
    // Create database connection
    pool = createPool();
    connection = await pool.getConnection();
    
    console.log('✅ Connected to database');
    
    // Get all agency codes
    const [agencies] = await connection.query(`
      SELECT DISTINCT age as code_agence FROM bkcli
      WHERE age IS NOT NULL AND TRIM(age) != ''
      ORDER BY age
    `);
    
    console.log(`ℹ️ Found ${agencies.length} agency codes`);
    
    // Hash the default password
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    
    // Create or update users with direct agency code as username
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const agency of agencies) {
      try {
        const agencyCode = agency.code_agence;
        
        // Check if user with agency code as username already exists
        const [existingUsers] = await connection.query(`
          SELECT id FROM users WHERE username = ?
        `, [agencyCode]);
        
        if (existingUsers.length > 0) {
          // Update existing user
          await connection.query(`
            UPDATE users 
            SET password_hash = ?, 
                role = 'agency_user', 
                agency_code = ?,
                status = 'active'
            WHERE username = ?
          `, [
            passwordHash, 
            agencyCode,
            agencyCode
          ]);
          
          updatedCount++;
          console.log(`✅ Updated user with username: ${agencyCode}`);
        } else {
          // Create new user with agency code as username
          const agencyName = await getAgencyName(connection, agencyCode);
          const fullName = `Utilisateur Agence ${agencyName || agencyCode}`;
          
          try {
            await connection.query(`
              INSERT INTO users (
                username, 
                email, 
                password_hash, 
                full_name, 
                role, 
                department, 
                agency_code, 
                status, 
                created_by
              )
              VALUES (?, ?, ?, ?, 'agency_user', 'Agence', ?, 'active', 1)
            `, [
              agencyCode,
              `agence.${agencyCode.toLowerCase()}@bdm-sa.com`,
              passwordHash,
              fullName,
              agencyCode
            ]);
            
            createdCount++;
            console.log(`✅ Created user with username: ${agencyCode}`);
          } catch (insertError) {
            console.error(`❌ Error processing agency ${agencyCode}:`, insertError.message);
          }
        }
        
        // Ensure agency exists in agency_correction_stats
        await ensureAgencyStats(connection, agencyCode);
        
      } catch (error) {
        console.error(`❌ Error processing agency ${agency.code_agence}:`, error.message);
      }
    }
    
    console.log(`\n✅ Created ${createdCount} new users and updated ${updatedCount} existing users`);
    console.log(`\n🔐 All agency users can now login with:`);
    console.log(`  - Username: [agency code] (e.g., 06450)`);
    console.log(`  - Password: ${DEFAULT_PASSWORD}`);
    
    // List some example users for testing
    console.log('\n🔐 Example login credentials:');
    const sampleAgencies = agencies.slice(0, 5);
    sampleAgencies.forEach(agency => {
      console.log(`  - Agency ${agency.code_agence}: Username=${agency.code_agence}, Password=${DEFAULT_PASSWORD}`);
    });
    
    console.log('\n🌐 Login URL: http://localhost:5174/login');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    if (connection) connection.release();
    if (pool) pool.end();
  }
}

// Helper function to get agency name
async function getAgencyName(connection, agencyCode) {
  try {
    // First try to get from agency_correction_stats
    const [agencyStats] = await connection.query(`
      SELECT agency_name FROM agency_correction_stats WHERE agency_code = ?
    `, [agencyCode]);
    
    if (agencyStats.length > 0 && agencyStats[0].agency_name) {
      return agencyStats[0].agency_name;
    }
    
    // If not found, try to get from bkage table if it exists
    try {
      const [agencyTable] = await connection.query(`
        SELECT lib FROM bkage WHERE age = ?
      `, [agencyCode]);
      
      if (agencyTable.length > 0 && agencyTable[0].lib) {
        return agencyTable[0].lib;
      }
    } catch (error) {
      // Table might not exist, ignore error
    }
    
    return `AGENCE ${agencyCode}`;
  } catch (error) {
    console.error(`Error getting agency name for ${agencyCode}:`, error.message);
    return `AGENCE ${agencyCode}`;
  }
}

// Helper function to ensure agency exists in agency_correction_stats
async function ensureAgencyStats(connection, agencyCode) {
  try {
    // Check if agency exists in agency_correction_stats
    const [agencyExists] = await connection.query(`
      SELECT id FROM agency_correction_stats WHERE agency_code = ?
    `, [agencyCode]);
    
    // If not, create it
    if (agencyExists.length === 0) {
      const agencyName = await getAgencyName(connection, agencyCode);
      
      await connection.query(`
        INSERT INTO agency_correction_stats (agency_code, agency_name)
        VALUES (?, ?)
      `, [agencyCode, agencyName]);
    }
  } catch (error) {
    console.error(`Error ensuring agency stats for ${agencyCode}:`, error.message);
  }
}

// Run the script
fixAgencyLogin();
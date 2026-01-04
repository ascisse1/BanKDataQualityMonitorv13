import { createPool } from '../server/database.js';
import bcrypt from 'bcryptjs';
import { AGENCIES, getAllAgencies } from '../server/agencyData.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'reset.16';

async function createDirectAgencyUsers() {
  console.log('🚀 Starting direct agency users creation script');
  
  let pool;
  let connection;
  
  try {
    // Create database connection
    pool = createPool();
    connection = await pool.getConnection();
    
    console.log('✅ Connected to database');
    
    // Get all agencies
    const agencies = getAllAgencies();
    console.log(`ℹ️ Found ${agencies.length} agencies`);
    
    // Hash the default password
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    
    // Create users for each agency with the agency code as username
    console.log('👥 Creating direct agency users...');
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const agency of agencies) {
      try {
        const { code_agence, lib_agence } = agency;
        
        // Use agency code directly as username
        const username = code_agence;
        const email = `agence.${code_agence.toLowerCase()}@bdm-sa.com`;
        const fullName = `Utilisateur Agence ${lib_agence}`;
        
        // Check if user already exists
        const [existingUser] = await connection.query(`
          SELECT id FROM users WHERE username = ?
        `, [username]);
        
        if (existingUser.length > 0) {
          // Update existing user
          await connection.query(`
            UPDATE users SET 
              password_hash = ?,
              email = ?,
              full_name = ?,
              role = 'agency_user',
              department = 'Agence',
              agency_code = ?,
              status = 'active'
            WHERE username = ?
          `, [passwordHash, email, fullName, code_agence, username]);
          
          console.log(`✅ Updated user for agency ${code_agence} - ${lib_agence}`);
        } else {
          // Insert the user
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
            username,
            email,
            passwordHash,
            fullName,
            code_agence
          ]);
          
          console.log(`✅ Created user for agency ${code_agence} - ${lib_agence}`);
        }
        
        // Check if agency exists in agency_correction_stats
        const [agencyStatsExists] = await connection.query(`
          SELECT id FROM agency_correction_stats WHERE agency_code = ?
        `, [code_agence]);
        
        // Create agency stats entry if it doesn't exist
        if (agencyStatsExists.length === 0) {
          await connection.query(`
            INSERT INTO agency_correction_stats (agency_code, agency_name)
            VALUES (?, ?)
          `, [code_agence, lib_agence]);
        }
        
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({ agency: agency.code_agence, error: error.message });
        console.error(`❌ Error creating user for agency ${agency.code_agence}:`, error.message);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully created/updated ${successCount} agency users`);
    console.log(`❌ Failed to create/update ${errorCount} agency users`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`  - Agency ${err.agency}: ${err.error}`);
      });
    }
    
    console.log('\n🔐 All agency users can now login with:');
    console.log(`  - Username: [agency code] (e.g., 06450)`);
    console.log(`  - Password: ${DEFAULT_PASSWORD}`);
    
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

// Run the script
createDirectAgencyUsers();
import { createPool } from '../server/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'reset.16';

async function resetAgencyPasswords() {
  console.log('🚀 Starting agency password reset script');
  
  let pool;
  let connection;
  
  try {
    // Create database connection
    pool = createPool();
    connection = await pool.getConnection();
    
    console.log('✅ Connected to database');
    
    // Get all agency users
    const [users] = await connection.query(`
      SELECT id, username, agency_code
      FROM users
      WHERE role = 'agency_user'
    `);
    
    console.log(`ℹ️ Found ${users.length} agency users`);
    
    // Hash the default password
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
    
    // Update all agency users
    let updatedCount = 0;
    
    for (const user of users) {
      try {
        // Update password
        await connection.query(`
          UPDATE users SET password_hash = ? WHERE id = ?
        `, [passwordHash, user.id]);
        
        updatedCount++;
        console.log(`✅ Reset password for user ${user.username} (Agency: ${user.agency_code || 'Unknown'})`);
      } catch (error) {
        console.error(`❌ Error resetting password for user ${user.username}:`, error.message);
      }
    }
    
    console.log(`\n✅ Reset passwords for ${updatedCount} agency users to: ${DEFAULT_PASSWORD}`);
    
    // List some example users for testing
    console.log('\n🔐 Example login credentials:');
    
    const sampleUsers = users.slice(0, 5);
    sampleUsers.forEach(user => {
      console.log(`  - Agency ${user.agency_code || user.username}: Username=${user.username}, Password=${DEFAULT_PASSWORD}`);
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
resetAgencyPasswords();
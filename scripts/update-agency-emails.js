import { createPool } from '../server/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function updateAgencyEmails() {
  console.log('🚀 Starting agency email update script');
  
  let pool;
  let connection;
  
  try {
    // Create database connection
    pool = createPool();
    connection = await pool.getConnection();
    
    console.log('✅ Connected to database');
    
    // Get all agency users
    const [users] = await connection.query(`
      SELECT id, username, email, agency_code
      FROM users
      WHERE role = 'agency_user'
    `);
    
    console.log(`ℹ️ Found ${users.length} agency users`);
    
    // Update emails to use bdm-sa.com domain
    let updatedCount = 0;
    
    for (const user of users) {
      try {
        // Skip users that already have the correct domain
        if (user.email && user.email.endsWith('@bdm-sa.com')) {
          console.log(`ℹ️ User ${user.username} already has correct email domain: ${user.email}`);
          continue;
        }
        
        // Generate new email
        const agencyCode = user.agency_code || user.username.replace('agency_', '');
        const newEmail = `agence.${agencyCode.toLowerCase()}@bdm-sa.com`;
        
        // Update email
        await connection.query(`
          UPDATE users SET email = ? WHERE id = ?
        `, [newEmail, user.id]);
        
        updatedCount++;
        console.log(`✅ Updated email for user ${user.username} to ${newEmail}`);
      } catch (error) {
        console.error(`❌ Error updating email for user ${user.username}:`, error.message);
      }
    }
    
    console.log(`\n✅ Updated emails for ${updatedCount} agency users`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    if (connection) connection.release();
    if (pool) pool.end();
  }
}

// Run the script
updateAgencyEmails();
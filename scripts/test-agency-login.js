import { createPool } from '../server/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testAgencyLogin() {
  console.log('🚀 Starting agency login test script');
  
  let pool;
  let connection;
  
  try {
    // Create database connection
    pool = createPool();
    connection = await pool.getConnection();
    
    console.log('✅ Connected to database');
    
    // Get agency user by code
    const agencyCode = process.argv[2];
    
    if (!agencyCode) {
      console.error('❌ Please provide an agency code as argument');
      console.log('Example: node scripts/test-agency-login.js 06450');
      return;
    }
    
    console.log(`🔍 Looking for agency user with code: ${agencyCode}`);
    
    // Find the user
    const [users] = await connection.query(`
      SELECT id, username, email, full_name, role, agency_code, status
      FROM users
      WHERE agency_code = ?
    `, [agencyCode]);
    
    if (users.length === 0) {
      console.error(`❌ No user found for agency code: ${agencyCode}`);
      return;
    }
    
    const user = users[0];
    console.log('✅ User found:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Username: ${user.username}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Full Name: ${user.full_name}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - Agency Code: ${user.agency_code}`);
    console.log(`  - Status: ${user.status}`);
    
    console.log('\n🔐 Login credentials:');
    console.log(`  - Username: ${user.username}`);
    console.log(`  - Password: reset.16`);
    
    // Verify password format
    const [passwordHash] = await connection.query(`
      SELECT password_hash FROM users WHERE id = ?
    `, [user.id]);
    
    if (passwordHash.length > 0) {
      // Test if the password matches
      const isValid = await bcrypt.compare('reset.16', passwordHash[0].password_hash);
      console.log(`\n🔑 Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      
      if (!isValid) {
        console.log('\n⚠️ Password might be incorrect. Updating password...');
        
        // Update password
        const newPasswordHash = await bcrypt.hash('reset.16', 10);
        await connection.query(`
          UPDATE users SET password_hash = ? WHERE id = ?
        `, [newPasswordHash, user.id]);
        
        console.log('✅ Password updated to "reset.16"');
      }
    }
    
    console.log('\n🌐 Login URL: http://localhost:5174/login');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    if (connection) connection.release();
    if (pool) pool.end();
  }
}

// Run the script
testAgencyLogin();
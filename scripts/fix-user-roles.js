import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixUserRoles() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Bamako@2209',
        database: 'bank_data_quality'
    });

    try {
        console.log('Checking current user roles...');
        const [users] = await connection.execute('SELECT id, username, role FROM users');

        console.log(`Found ${users.length} users:`);
        users.forEach(user => {
            console.log(`  - ${user.username}: ${user.role}`);
        });

        console.log('\nUpdating roles to uppercase...');

        // Update roles to uppercase
        await connection.execute(`
      UPDATE users
      SET role = CASE
        WHEN LOWER(role) = 'admin' THEN 'ADMIN'
        WHEN LOWER(role) = 'auditor' THEN 'AUDITOR'
        WHEN LOWER(role) = 'user' THEN 'USER'
        WHEN LOWER(role) = 'agency_user' THEN 'AGENCY_USER'
        ELSE role
      END
      WHERE role IN ('admin', 'auditor', 'user', 'agency_user')
    `);

        console.log('Roles updated successfully!');

        const [updatedUsers] = await connection.execute('SELECT id, username, role FROM users');
        console.log('\nUpdated users:');
        updatedUsers.forEach(user => {
            console.log(`  - ${user.username}: ${user.role}`);
        });

    } catch (error) {
        console.error('Error fixing user roles:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

fixUserRoles()
    .then(() => {
        console.log('\nDone!');
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed:', error.message);
        process.exit(1);
    });

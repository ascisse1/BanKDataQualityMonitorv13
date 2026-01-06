import bcrypt from 'bcryptjs';

const password = 'admin';
const hash = bcrypt.hashSync(password, 10);

console.log('Generated BCrypt hash for password "admin":');
console.log(hash);
console.log('\nRun this SQL command in MySQL:');
console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`);

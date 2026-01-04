import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bank_data_quality',
  multipleStatements: true
};

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   MySQL Data Seeding for Bank Data Quality Monitor       ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');

async function seedDatabase() {
  let connection = null;

  try {
    console.log('🔌 Connecting to MySQL database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected successfully');
    console.log('');

    // Create default users
    console.log('👥 Creating default users...');

    const defaultPassword = await bcrypt.hash('admin123', 10);
    const agency01001Password = await bcrypt.hash('agency01001', 10);
    const agency01002Password = await bcrypt.hash('agency01002', 10);
    const agency01003Password = await bcrypt.hash('agency01003', 10);

    const users = [
      ['admin', 'admin@bdm-sa.com', defaultPassword, 'Administrateur Système', 'admin', 'Administration', null, 'active'],
      ['auditor', 'auditor@bdm-sa.com', defaultPassword, 'Auditeur Principal', 'auditor', 'Audit', null, 'active'],
      ['user', 'user@bdm-sa.com', defaultPassword, 'Utilisateur Standard', 'user', 'Opérations', null, 'active'],
      ['agency_01001', 'agence.01001@bdm-sa.com', agency01001Password, 'Utilisateur Agence Ganhi', 'agency_user', 'Agence', '01001', 'active'],
      ['agency_01002', 'agence.01002@bdm-sa.com', agency01002Password, 'Utilisateur Agence Haie Vive', 'agency_user', 'Agence', '01002', 'active'],
      ['agency_01003', 'agence.01003@bdm-sa.com', agency01003Password, 'Utilisateur Agence Cadjehoun', 'agency_user', 'Agence', '01003', 'active']
    ];

    for (const user of users) {
      try {
        await connection.query(
          'INSERT INTO users (username, email, password_hash, full_name, role, department, agency_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          user
        );
        console.log(`   ✅ Created user: ${user[0]}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`   ⚠️  User ${user[0]} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }
    console.log('');

    // Create sample clients (Particuliers)
    console.log('👤 Creating sample individual clients...');
    const individualClients = [
      ['CLI000001', 'TRAORE', '1', 'Mamadou', 'ML12345', 'DIALLO Fatoumata', '1985-03-15', 'ML', '01001', 'M', 'Bamako', 'ML', 'CNI'],
      ['CLI000002', 'DIALLO', '1', 'Aissata', 'ML23456', 'TOURE Mariam', '1990-07-22', 'ML', '01002', 'F', 'Sikasso', 'ML', 'CNI'],
      ['CLI000003', 'COULIBALY', '1', 'Ibrahim', 'ML34567', 'KEITA Kadiatou', '1978-11-30', 'ML', '01003', 'M', 'Segou', 'ML', 'CNI'],
      ['CLI000004', 'KEITA', '1', 'Fatoumata', '', '', null, 'ML', '01001', 'F', '', '', ''],
      ['CLI000005', 'TOURE', '1', 'Sekou', 'ML56789', '', '1995-05-10', '', '01002', 'M', 'Kayes', 'ML', 'CNI'],
      ['CLI000006', 'SMITH', '1', 'John', 'US12345', 'SMITH Mary', '1980-12-01', 'US', '01001', 'M', 'New York', 'US', 'PSP'],
      ['CLI000007', 'JOHNSON', '1', 'Sarah', 'US23456', 'JOHNSON Emma', '1992-03-25', 'US', '01002', 'F', 'Chicago', 'US', 'PSP'],
      ['CLI000008', 'WILLIAMS', '1', 'Robert', '', '', null, 'US', '01003', 'M', '', '', '']
    ];

    for (const client of individualClients) {
      try {
        await connection.query(
          'INSERT INTO bkcli (cli, nom, tcli, pre, nid, nmer, dna, nat, age, sext, viln, payn, tid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          client
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.log(`   ⚠️  Error creating client ${client[0]}: ${error.message}`);
        }
      }
    }
    console.log(`   ✅ Created ${individualClients.length} individual clients`);
    console.log('');

    // Create sample clients (Entreprises)
    console.log('🏢 Creating sample corporate clients...');
    const corporateClients = [
      ['ENT000001', 'SOCIETE A', '2', 'SOCIETE ANONYME A', 'MA12345', '2010-01-15', '01001', 'SA', 'Commerce', 'SA', 'GE', 'Client'],
      ['ENT000002', 'SOCIETE B', '2', 'SOCIETE ANONYME B', 'MA23456', '2015-06-20', '01002', 'SB', 'Service', 'SARL', 'PME', 'Client'],
      ['ENT000003', 'SOCIETE C', '2', '', '', null, '01003', '', '', '', '', ''],
      ['ENT000004', 'US COMPANY', '2', 'US CORPORATION', 'US12345', '2008-03-10', '01001', 'USC', 'Finance', 'INC', 'GE', 'Client']
    ];

    for (const client of corporateClients) {
      try {
        await connection.query(
          'INSERT INTO bkcli (cli, nom, tcli, rso, nrc, datc, age, sig, sec, fju, catn, lienbq) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          client
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.log(`   ⚠️  Error creating client ${client[0]}: ${error.message}`);
        }
      }
    }
    console.log(`   ✅ Created ${corporateClients.length} corporate clients`);
    console.log('');

    // Create sample clients (Institutionnels)
    console.log('🏛️  Creating sample institutional clients...');
    const institutionalClients = [
      ['INS000001', 'INSTITUTION A', '3', 'INSTITUTION PUBLIQUE A', 'ML98765', '2005-01-01', '01001', 'Public', 'EP', 'GE', 'Client'],
      ['INS000002', 'INSTITUTION B', '3', 'INSTITUTION PUBLIQUE B', 'ML87654', '2010-06-15', '01002', 'Education', 'EP', 'GE', 'Client'],
      ['INS000003', 'INSTITUTION C', '3', '', '', null, '01003', '', '', '', '']
    ];

    for (const client of institutionalClients) {
      try {
        await connection.query(
          'INSERT INTO bkcli (cli, nom, tcli, rso, nrc, datc, age, sec, fju, catn, lienbq) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          client
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.log(`   ⚠️  Error creating client ${client[0]}: ${error.message}`);
        }
      }
    }
    console.log(`   ✅ Created ${institutionalClients.length} institutional clients`);
    console.log('');

    // Create agency correction stats
    console.log('📊 Creating agency correction statistics...');
    const agencies = [
      ['01001', 'Agence Ganhi', 1500, 800, 400, 300],
      ['01002', 'Agence Haie Vive', 1200, 650, 350, 200],
      ['01003', 'Agence Cadjehoun', 1800, 900, 500, 400]
    ];

    for (const agency of agencies) {
      try {
        const correctionRate = ((agency[3] / agency[2]) * 100).toFixed(2);
        await connection.query(
          'INSERT INTO agency_correction_stats (agency_code, agency_name, total_anomalies, fixed_anomalies, in_review_anomalies, rejected_anomalies, correction_rate) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [...agency, correctionRate]
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.log(`   ⚠️  Error creating agency stats ${agency[0]}: ${error.message}`);
        }
      }
    }
    console.log(`   ✅ Created ${agencies.length} agency statistics`);
    console.log('');

    // Create FATCA clients
    console.log('🌍 Creating FATCA clients...');
    const fatcaClients = [
      ['CLI000006', 'SMITH John', '2020-01-15', 'Client Actif', 'US', 'US', '123 Broadway, New York', 'US', '+12125551234', null, null, 'À vérifier'],
      ['CLI000007', 'JOHNSON Sarah', '2021-06-20', 'Client Actif', 'US', 'US', '456 Michigan Ave, Chicago', 'US', '+13125559876', null, null, 'Confirmé'],
      ['ENT000004', 'US COMPANY', '2008-03-10', 'Client Actif', null, null, '789 Wall Street, New York', 'US', '+12125557890', null, null, 'À vérifier']
    ];

    for (const fatca of fatcaClients) {
      try {
        await connection.query(
          'INSERT INTO fatca_clients (cli, nom, date_entree_relation, status_client, pays_naissance, nationalite, adresse, pays_adresse, telephone, relation_client, type_relation, fatca_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          fatca
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.log(`   ⚠️  Error creating FATCA client ${fatca[0]}: ${error.message}`);
        }
      }
    }
    console.log(`   ✅ Created ${fatcaClients.length} FATCA clients`);
    console.log('');

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║            Data seeding completed successfully! 🎉       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Demo users created:');
    console.log('  - admin / admin123           (Administrator)');
    console.log('  - auditor / admin123         (Auditor)');
    console.log('  - user / admin123            (User)');
    console.log('  - agency_01001 / agency01001 (Agency User Ganhi)');
    console.log('  - agency_01002 / agency01002 (Agency User Haie Vive)');
    console.log('  - agency_01003 / agency01003 (Agency User Cadjehoun)');
    console.log('');
    console.log('Next step:');
    console.log('  Run: npm run dev:full');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Seeding failed:');
    console.error(`   ${error.message}`);
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

seedDatabase();

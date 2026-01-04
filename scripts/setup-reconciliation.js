const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupReconciliation() {
  console.log('🔧 Configuration des tables de réconciliation...\n');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bank_data_quality',
    multipleStatements: true
  });

  try {
    const schema = fs.readFileSync(
      path.join(__dirname, '../database/reconciliation-schema.sql'),
      'utf8'
    );

    await connection.query(schema);
    console.log('✅ Tables de réconciliation créées');

    const [tasks] = await connection.query(
      'SELECT COUNT(*) as count FROM reconciliation_tasks'
    );
    console.log(`📊 Tâches de réconciliation: ${tasks[0].count}`);

    const [stats] = await connection.query('SELECT * FROM reconciliation_stats LIMIT 5');
    console.log(`📈 Statistiques disponibles: ${stats.length} périodes\n`);

    console.log('✅ Configuration terminée');
    console.log('\nProchaines étapes:');
    console.log('  1. Démarrer Spring Boot: cd backend-java && mvn spring-boot:run');
    console.log('  2. Tester: curl http://localhost:8080/api/reconciliation/health');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

setupReconciliation();

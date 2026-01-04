import dotenv from 'dotenv';

dotenv.config();

console.log('\n🔍 Test de connexion ODBC avec DSN\n');
console.log('Configuration:');
console.log(`  DSN: ${process.env.INFORMIX_DSN}`);
console.log(`  User: ${process.env.INFORMIX_USER}`);
console.log('');

async function testConnection() {
  try {
    // Import ODBC
    console.log('📦 Chargement du module ODBC...');
    const odbcModule = await import('odbc');
    const odbc = odbcModule.default || odbcModule;
    console.log('✅ Module ODBC chargé avec succès\n');

    // Build connection string
    const dsn = process.env.INFORMIX_DSN;
    const user = process.env.INFORMIX_USER;
    const password = process.env.INFORMIX_PASSWORD;

    const connectionString = `DSN=${dsn};UID=${user};PWD=${password};`;
    console.log('🔗 Chaîne de connexion:');
    console.log(`  DSN=${dsn};UID=${user};PWD=****;\n`);

    // Create pool
    console.log('🔄 Création du pool de connexions...');
    const pool = await odbc.pool(connectionString);
    console.log('✅ Pool créé avec succès\n');

    // Test query
    console.log('🔍 Exécution d\'une requête de test...');
    const connection = await pool.connect();
    const result = await connection.query('SELECT FIRST 5 tabname FROM systables WHERE tabtype = \'T\' ORDER BY tabname');
    await connection.close();

    console.log('✅ Requête exécutée avec succès\n');
    console.log('📊 Tables trouvées:');
    result.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.tabname || row.TABNAME}`);
    });

    // Close pool
    await pool.close();
    console.log('\n✅ Pool fermé avec succès');
    console.log('\n🎉 TEST RÉUSSI ! La connexion Informix fonctionne correctement.\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERREUR lors du test de connexion:\n');
    console.error('Message:', error.message);
    if (error.odbcErrors && error.odbcErrors.length > 0) {
      console.error('\nDétails ODBC:');
      error.odbcErrors.forEach(err => {
        console.error(`  State: ${err.state}`);
        console.error(`  Code: ${err.code}`);
        console.error(`  Message: ${err.message}`);
      });
    }
    console.error('\n💡 Vérifiez que:');
    console.error('  1. Le DSN "' + process.env.INFORMIX_DSN + '" existe dans la configuration ODBC');
    console.error('  2. Les identifiants sont corrects');
    console.error('  3. Le serveur Informix est accessible\n');
    process.exit(1);
  }
}

testConnection();

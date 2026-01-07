import dotenv from 'dotenv';

dotenv.config();

console.log('\n🔍 Test de connexion ODBC MANUELLE (sans DSN)\n');

async function testConnection() {
  try {
    // Import ODBC
    console.log('📦 Chargement du module ODBC...');
    const odbcModule = await import('odbc');
    const odbc = odbcModule.default || odbcModule;
    console.log('✅ Module ODBC chargé avec succès\n');

    // Build connection string MANUALLY
    const connectionString = `DRIVER={IBM INFORMIX ODBC DRIVER};HOST=10.3.0.66;PORT=1526;SERVER=ol_bdmsa;DATABASE=bdmsa;UID=bank;PWD=bank;PROTOCOL=onsoctcp;`;

    console.log('🔗 Chaîne de connexion MANUELLE:');
    console.log('  DRIVER={IBM INFORMIX ODBC DRIVER}');
    console.log('  HOST=10.3.0.66');
    console.log('  PORT=1526');
    console.log('  SERVER=ol_bdmsa');
    console.log('  DATABASE=bdmsa');
    console.log('  PROTOCOL=onsoctcp');
    console.log('  UID=bank');
    console.log('  PWD=****\n');

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
    console.log('\n🎉 TEST RÉUSSI ! La connexion manuelle fonctionne.\n');
    console.log('💡 Le problème vient donc du DSN. Vérifiez le Server Name dans le DSN.');
    console.log('   Il devrait être "ol_bdmsa" et non "ol_bdmsa_tcp"\n');
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
    process.exit(1);
  }
}

testConnection();

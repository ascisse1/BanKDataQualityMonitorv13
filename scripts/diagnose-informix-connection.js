import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

dotenv.config({ path: envPath });

console.log('');
console.log('🔍 DIAGNOSTIC DE CONNEXION INFORMIX');
console.log('=====================================');
console.log('');

async function diagnose() {
  // 1. Check ODBC availability
  console.log('1️⃣ Vérification des drivers ODBC...');
  let odbc = null;
  try {
    const odbcModule = await import('odbc');
    odbc = odbcModule.default || odbcModule;
    console.log('   ✅ Module ODBC chargé avec succès');
  } catch (error) {
    console.log('   ❌ Module ODBC non disponible');
    console.log(`   Erreur: ${error.message}`);
    console.log('');
    console.log('   Solution: Installez le module ODBC:');
    console.log('   npm install odbc');
    return;
  }

  // 2. Check environment variables
  console.log('');
  console.log('2️⃣ Vérification des variables d\'environnement...');
  const dsn = process.env.INFORMIX_DSN;
  const user = process.env.INFORMIX_USER;
  const password = process.env.INFORMIX_PASSWORD;

  console.log(`   DSN: ${dsn || '❌ NON DÉFINI'}`);
  console.log(`   User: ${user || '❌ NON DÉFINI'}`);
  console.log(`   Password: ${password ? '✅ Défini' : '❌ NON DÉFINI'}`);

  if (!dsn) {
    console.log('');
    console.log('   ❌ INFORMIX_DSN non défini dans .env');
    return;
  }

  // 3. Test DSN connection with detailed error
  console.log('');
  console.log('3️⃣ Test de connexion au DSN...');
  const connectionString = `DSN=${dsn};UID=${user};PWD=${password};`;
  console.log(`   Connection String: DSN=${dsn};UID=${user};PWD=***;`);

  try {
    console.log('   Tentative de connexion...');
    const connection = await odbc.connect(connectionString);
    console.log('   ✅ Connexion réussie!');

    // Test simple query
    console.log('');
    console.log('4️⃣ Test de requête...');
    try {
      const result = await connection.query('SELECT FIRST 1 * FROM systables');
      console.log('   ✅ Requête exécutée avec succès');
      console.log(`   Résultat: ${result.length} ligne(s) retournée(s)`);
    } catch (queryError) {
      console.log('   ❌ Erreur lors de l\'exécution de la requête');
      console.log(`   ${queryError.message}`);
    }

    await connection.close();
    console.log('');
    console.log('✅ DIAGNOSTIC RÉUSSI - La connexion Informix fonctionne!');
  } catch (error) {
    console.log('   ❌ Échec de la connexion');
    console.log('');
    console.log('📋 DÉTAILS DE L\'ERREUR:');
    console.log('------------------------');
    console.log(`Message: ${error.message}`);
    if (error.odbcErrors) {
      console.log('');
      console.log('Erreurs ODBC:');
      error.odbcErrors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. [${err.state}] ${err.message}`);
      });
    }
    console.log('');
    console.log('🔧 SOLUTIONS POSSIBLES:');
    console.log('----------------------');
    console.log('1. Vérifiez que le serveur Informix est accessible:');
    console.log('   - Ping du serveur: ping 10.3.0.66');
    console.log('   - Test port: telnet 10.3.0.66 1526');
    console.log('');
    console.log('2. Vérifiez la configuration du DSN:');
    console.log('   - Ouvrez: Panneau de configuration > Outils d\'administration > Sources de données ODBC');
    console.log('   - Vérifiez que le DSN "lcb" existe');
    console.log('   - Testez la connexion depuis l\'interface ODBC');
    console.log('');
    console.log('3. Vérifiez les credentials:');
    console.log('   - User: bank');
    console.log('   - Password: bank');
    console.log('');
    console.log('4. Vérifiez les variables d\'environnement Informix:');
    console.log('   - INFORMIXDIR doit pointer vers le répertoire d\'installation');
    console.log('   - INFORMIXSERVER doit être défini');
    console.log('   - Exécutez: .\\scripts\\setup-informix-env.ps1');
  }
}

diagnose().catch(error => {
  console.error('');
  console.error('❌ ERREUR FATALE:', error.message);
  process.exit(1);
});

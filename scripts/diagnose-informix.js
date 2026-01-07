import odbc from 'odbc';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('\n🔍 DIAGNOSTIC COMPLET DE LA CONNEXION INFORMIX\n');
console.log('=' .repeat(60));

// 1. Vérifier les variables d'environnement
console.log('\n1️⃣ VARIABLES D\'ENVIRONNEMENT\n');
const envVars = {
  'INFORMIXDIR': process.env.INFORMIXDIR,
  'DB_LOCALE': process.env.DB_LOCALE,
  'CLIENT_LOCALE': process.env.CLIENT_LOCALE,
  'LANG': process.env.LANG,
  'INFORMIX_DSN': process.env.INFORMIX_DSN,
  'INFORMIX_USER': process.env.INFORMIX_USER,
  'INFORMIX_HOST': process.env.INFORMIX_HOST,
  'INFORMIX_PORT': process.env.INFORMIX_PORT,
  'INFORMIX_SERVER': process.env.INFORMIX_SERVER,
  'INFORMIX_DATABASE': process.env.INFORMIX_DATABASE
};

for (const [key, value] of Object.entries(envVars)) {
  if (value) {
    if (key === 'INFORMIX_PASSWORD') {
      console.log(`   ✅ ${key} = ****`);
    } else {
      console.log(`   ✅ ${key} = ${value}`);
    }
  } else {
    console.log(`   ❌ ${key} = (non défini)`);
  }
}

// 2. Tester différentes chaînes de connexion
console.log('\n2️⃣ TEST DES CONNEXIONS\n');

const connectionTests = [];

// Test avec DSN
if (process.env.INFORMIX_DSN && process.env.INFORMIX_USER && process.env.INFORMIX_PASSWORD) {
  connectionTests.push({
    name: 'DSN Simple',
    connectionString: `DSN=${process.env.INFORMIX_DSN};UID=${process.env.INFORMIX_USER};PWD=${process.env.INFORMIX_PASSWORD};`
  });
}

// Test avec DSN et options DB_LOCALE
if (process.env.INFORMIX_DSN && process.env.INFORMIX_USER && process.env.INFORMIX_PASSWORD) {
  connectionTests.push({
    name: 'DSN avec DB_LOCALE',
    connectionString: `DSN=${process.env.INFORMIX_DSN};UID=${process.env.INFORMIX_USER};PWD=${process.env.INFORMIX_PASSWORD};DB_LOCALE=en_US.819;CLIENT_LOCALE=en_US.utf8;`
  });
}

// Test avec connexion manuelle
if (process.env.INFORMIX_HOST && process.env.INFORMIX_PORT && process.env.INFORMIX_SERVER && process.env.INFORMIX_DATABASE) {
  connectionTests.push({
    name: 'Connexion manuelle',
    connectionString: `DRIVER={IBM INFORMIX ODBC DRIVER};HOST=${process.env.INFORMIX_HOST};SERVICE=${process.env.INFORMIX_PORT};SERVER=${process.env.INFORMIX_SERVER};DATABASE=${process.env.INFORMIX_DATABASE};PROTOCOL=onsoctcp;UID=${process.env.INFORMIX_USER};PWD=${process.env.INFORMIX_PASSWORD};`
  });
}

async function testConnection(test) {
  console.log(`\n📋 Test: ${test.name}`);
  console.log(`   Chaîne: ${test.connectionString.replace(/PWD=[^;]+;/, 'PWD=****;')}`);

  try {
    const pool = await odbc.pool({
      connectionString: test.connectionString,
      initialSize: 1,
      incrementSize: 1,
      maxSize: 1,
      reuseConnections: true,
      shrink: true,
      connectionTimeout: 10,
      loginTimeout: 10
    });

    console.log('   ✅ Pool créé');

    try {
      const connection = await pool.connect();
      console.log('   ✅ Connexion établie');

      try {
        const result = await connection.query('SELECT FIRST 1 tabname FROM systables WHERE tabid > 99');
        console.log('   ✅ Requête exécutée');
        console.log(`   ✅ Résultat: ${result.length} table(s) trouvée(s)`);

        if (result.length > 0) {
          console.log(`   📊 Exemple: ${result[0].tabname}`);
        }

        await connection.close();
        console.log('   ✅ Connexion fermée');

        await pool.close();
        console.log('   ✅ Pool fermé');

        return { success: true, test: test.name };
      } catch (queryError) {
        console.log(`   ❌ Erreur de requête: ${queryError.message}`);
        await connection.close();
        await pool.close();
        return { success: false, test: test.name, error: queryError };
      }
    } catch (connectError) {
      console.log(`   ❌ Erreur de connexion: ${connectError.message}`);
      if (connectError.odbcErrors) {
        connectError.odbcErrors.forEach(err => {
          console.log(`      State: ${err.state}`);
          console.log(`      Code: ${err.code}`);
          console.log(`      Message: ${err.message}`);
        });
      }
      await pool.close();
      return { success: false, test: test.name, error: connectError };
    }
  } catch (poolError) {
    console.log(`   ❌ Erreur de création du pool: ${poolError.message}`);
    if (poolError.odbcErrors) {
      poolError.odbcErrors.forEach(err => {
        console.log(`      State: ${err.state}`);
        console.log(`      Code: ${err.code}`);
        console.log(`      Message: ${err.message}`);
      });
    }
    return { success: false, test: test.name, error: poolError };
  }
}

// Exécuter tous les tests
async function runAllTests() {
  const results = [];

  for (const test of connectionTests) {
    const result = await testConnection(test);
    results.push(result);
  }

  // Résumé
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 RÉSUMÉ DES TESTS\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (successful.length > 0) {
    console.log('✅ Tests réussis:');
    successful.forEach(r => console.log(`   - ${r.test}`));
  }

  if (failed.length > 0) {
    console.log('\n❌ Tests échoués:');
    failed.forEach(r => console.log(`   - ${r.test}`));
  }

  console.log('\n' + '=' .repeat(60));

  if (successful.length > 0) {
    console.log('\n🎉 AU MOINS UN TEST A RÉUSSI !');
    console.log('   Utilisez la configuration qui fonctionne dans votre application.\n');
  } else {
    console.log('\n❌ TOUS LES TESTS ONT ÉCHOUÉ');
    console.log('\n💡 ACTIONS À EFFECTUER:\n');
    console.log('1. Vérifiez la configuration du DSN avec:');
    console.log('   odbcad32.exe');
    console.log('\n2. Assurez-vous que le Server Name est "ol_bdmsa" (sans _tcp)');
    console.log('\n3. Testez la connexion directement dans l\'administrateur ODBC');
    console.log('\n4. Vérifiez que le serveur Informix est accessible:');
    console.log(`   ping ${process.env.INFORMIX_HOST || '10.3.0.66'}`);
    console.log('\n5. Vérifiez les logs du serveur Informix (côté AIX)');
    console.log('\n6. L\'erreur -23101 peut indiquer:');
    console.log('   - Le serveur n\'est pas démarré');
    console.log('   - Le nom du serveur est incorrect dans le DSN');
    console.log('   - Un problème de réseau/firewall');
    console.log('   - Les permissions utilisateur sont insuffisantes\n');
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});

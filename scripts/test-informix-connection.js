import informixDb from '../server/informixDatabase.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('');
console.log('🔍 Test de connexion Informix');
console.log('================================');
console.log('');

async function testConnection() {
  try {
    console.log('Configuration:');
    console.log(`  Host: ${informixDb.config.host}`);
    console.log(`  Port: ${informixDb.config.port}`);
    console.log(`  Server: ${informixDb.config.server}`);
    console.log(`  Database: ${informixDb.config.database}`);
    console.log(`  User: ${informixDb.config.user}`);
    console.log('');

    console.log('1️⃣ Tentative de connexion...');
    await informixDb.createPool();
    console.log('');

    console.log('2️⃣ Test de requête...');
    const result = await informixDb.testConnection();

    if (result.success) {
      console.log('✅ Connexion réussie!');
      console.log('');

      console.log('3️⃣ Comptage des clients...');
      try {
        const clientsResult = await informixDb.executeQuery('SELECT COUNT(*) as count FROM bkcli');

        if (clientsResult && clientsResult.length > 0) {
          console.log(`✅ Nombre de clients trouvés: ${clientsResult[0].count || clientsResult[0].COUNT}`);
          console.log('');
          console.log('🎉 Configuration Informix opérationnelle!');
          console.log('');
          console.log('Vous pouvez maintenant démarrer l\'application:');
          console.log('  npm run dev:full');
        } else {
          console.log('⚠️ Connexion OK mais table bkcli vide ou inexistante');
          console.log('Vérifier que la table bkcli existe dans la base');
        }
      } catch (queryError) {
        console.log('⚠️ Connexion OK mais erreur lors de la requête sur bkcli');
        console.log('Erreur:', queryError.message);
        console.log('');
        console.log('La connexion fonctionne, mais vérifiez:');
        console.log('  - Que la table bkcli existe');
        console.log('  - Que l\'utilisateur a les permissions SELECT');
      }
    } else {
      console.error('❌ Échec de la connexion:', result.message);
      console.log('');
      console.log('Vérifications à faire:');
      console.log('');
      console.log('1. Vérifier le fichier sqlhosts:');
      console.log(`   Emplacement: C:\\Program Files\\Informix Client-SDK\\etc\\sqlhosts`);
      console.log('   Contenu attendu:');
      console.log(`   ${informixDb.config.server} onsoctcp ${informixDb.config.host} ${informixDb.config.port}`);
      console.log('');
      console.log('2. Vérifier que le serveur Informix est accessible:');
      console.log(`   ping ${informixDb.config.host}`);
      console.log('');
      console.log('3. Vérifier les variables d\'environnement (redémarrer le terminal):');
      console.log('   echo %INFORMIXDIR%');
      console.log('   Devrait afficher: C:\\Program Files\\Informix Client-SDK');
      console.log('');
      console.log('4. Vérifier que INFORMIXDIR pointe vers le bon dossier:');
      console.log('   Actuel:', process.env.INFORMIXDIR);
      console.log('   Attendu: C:\\Program Files\\Informix Client-SDK');
    }

    await informixDb.closePool();
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Erreur lors du test de connexion');
    console.error('');

    if (error.message.includes('ODBC drivers not installed')) {
      console.error('Les drivers ODBC Informix ne sont pas installés ou mal configurés.');
      console.error('');
      console.error('Vérifications:');
      console.error('  1. Vérifier INFORMIXDIR:');
      console.error(`     Actuel: ${process.env.INFORMIXDIR || 'NON DÉFINI'}`);
      console.error(`     Attendu: C:\\Program Files\\Informix Client-SDK`);
      console.error('');
      console.error('  2. Vérifier que le Client SDK est installé:');
      console.error('     dir "C:\\Program Files\\Informix Client-SDK\\bin"');
      console.error('');
      console.error('  3. Redémarrer le terminal après avoir configuré les variables');
      console.error('');
      console.error('📖 Consultez INFORMIX_SETUP.md pour les instructions détaillées');
    } else {
      console.error('Message:', error.message);
      console.error('');
      console.error('Stack:', error.stack);
    }

    console.error('');
    process.exit(1);
  }
}

testConnection();

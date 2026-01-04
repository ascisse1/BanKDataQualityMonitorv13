import informixDb from './informixDatabase.js';
import { initializeMySQLPool, testMySQLConnection } from './mysqlDatabase.js';
import dotenv from 'dotenv';

dotenv.config();

let mysqlPool = null;
let informixPool = null;
let isInformixAvailable = false;
let isMySQLAvailable = false;

export async function initializeHybridDatabase() {
  console.log('');
  console.log('🔄 Initialisation du système hybride de bases de données');
  console.log('   - MySQL: Authentification, utilisateurs, règles de gestion');
  console.log('   - Informix: Données métier (FATCA, anomalies)');
  console.log('');

  try {
    console.log('1️⃣ Connexion à MySQL pour les données applicatives...');
    mysqlPool = initializeMySQLPool();
    const mysqlTest = await testMySQLConnection();

    if (mysqlTest.success) {
      isMySQLAvailable = true;
      console.log('✅ MySQL connecté - Prêt pour authentification et règles');
    } else {
      throw new Error(mysqlTest.message);
    }
  } catch (error) {
    console.error('❌ MySQL non disponible:', error.message);
    console.error('   L\'authentification utilisera les comptes par défaut');
    isMySQLAvailable = false;
  }

  console.log('');
  console.log('2️⃣ Connexion à Informix pour les données métier...');

  try {
    informixPool = await informixDb.createPool();
    const informixTest = await informixDb.testConnection();

    if (informixTest.success) {
      isInformixAvailable = true;
      console.log('✅ Informix connecté - Données FATCA et anomalies disponibles');
    } else {
      throw new Error(informixTest.message);
    }
  } catch (error) {
    console.error('❌ Informix non disponible:', error.message);
    isInformixAvailable = false;

    // Check if degraded mode is allowed
    const allowDegradedMode = process.env.ALLOW_DEGRADED_MODE === 'true';

    if (!allowDegradedMode) {
      console.error('   ⚠️  L\'application NE PEUT PAS démarrer sans Informix');
      console.error('');
      console.error('   Solutions:');
      console.error('   1. Vérifiez que le serveur Informix est accessible');
      console.error('   2. Vérifiez les paramètres de connexion dans .env');
      console.error('   3. Vérifiez que les drivers ODBC Informix sont installés');
      console.error('   4. Consultez INFORMIX_ERROR_23101.md pour l\'erreur -23101');
      console.error('');
      console.error('   Pour démarrer en mode dégradé (MySQL seulement), ajoutez dans .env:');
      console.error('   ALLOW_DEGRADED_MODE=true');
      console.error('');
      throw new Error('Informix database connection required but unavailable');
    } else {
      console.warn('');
      console.warn('⚠️  MODE DÉGRADÉ ACTIVÉ');
      console.warn('   L\'application démarre sans Informix');
      console.warn('   Certaines fonctionnalités seront limitées');
      console.warn('   Consultez INFORMIX_ERROR_23101.md pour résoudre le problème');
      console.warn('');
    }
  }

  console.log('');
  console.log('📊 Configuration finale:');
  console.log(`   MySQL (Auth/Règles): ${isMySQLAvailable ? '✅ Actif' : '❌ Non disponible'}`);
  console.log(`   Informix (FATCA/Anomalies): ${isInformixAvailable ? '✅ Actif' : '❌ Non disponible'}`);
  console.log('');

  return {
    mysql: {
      pool: mysqlPool,
      available: isMySQLAvailable
    },
    informix: {
      pool: informixPool,
      available: isInformixAvailable
    }
  };
}

export function getMySQLPool() {
  if (!isMySQLAvailable) {
    throw new Error('MySQL not available. Cannot perform authentication operations.');
  }
  return mysqlPool;
}

export function getInformixPool() {
  if (!isInformixAvailable) {
    throw new Error('Informix database not available. Cannot retrieve data.');
  }
  return informixPool;
}

export function isMySQLConnected() {
  return isMySQLAvailable;
}

export function isInformixConnected() {
  return isInformixAvailable;
}

export async function executeInformixQuery(sql, params = []) {
  if (isInformixAvailable) {
    return await informixDb.executeQuery(sql, params);
  } else {
    throw new Error('Informix not available. Cannot execute query.');
  }
}

export async function executeMySQLQuery(sql, params = []) {
  if (!isMySQLAvailable) {
    throw new Error('MySQL not available. Cannot execute query.');
  }

  const connection = await mysqlPool.getConnection();
  try {
    const [rows] = await connection.query(sql, params);
    return rows;
  } finally {
    connection.release();
  }
}

export async function closeAll() {
  console.log('');
  console.log('🔌 Fermeture des connexions...');

  if (informixPool && isInformixAvailable) {
    await informixDb.closePool();
    console.log('✅ Informix déconnecté');
  }

  if (mysqlPool && isMySQLAvailable) {
    await mysqlPool.end();
    console.log('✅ MySQL déconnecté');
  }

  console.log('');
}

export default {
  initializeHybridDatabase,
  getMySQLPool,
  getInformixPool,
  isMySQLConnected,
  isInformixConnected,
  executeInformixQuery,
  executeMySQLQuery,
  closeAll
};

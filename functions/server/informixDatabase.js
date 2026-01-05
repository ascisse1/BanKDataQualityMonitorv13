import dotenv from 'dotenv';

dotenv.config();

const informixConfig = {
  dsn: process.env.INFORMIX_DSN || null,
  host: process.env.INFORMIX_HOST || '10.3.0.66',
  port: parseInt(process.env.INFORMIX_PORT) || 1526,
  user: process.env.INFORMIX_USER || 'bank',
  password: process.env.INFORMIX_PASSWORD || 'bank',
  database: process.env.INFORMIX_DATABASE || 'bdmsa',
  server: process.env.INFORMIX_SERVER || 'ol_bdmsa'
};

let odbc = null;
let odbcAvailable = false;

async function loadOdbc() {
  if (odbcAvailable) return odbc;

  try {
    const odbcModule = await import('odbc');
    odbc = odbcModule.default || odbcModule;
    odbcAvailable = true;
    return odbc;
  } catch (error) {
    console.error('');
    console.error('❌ ERREUR: Les drivers ODBC Informix ne sont pas installés!');
    console.error('');
    console.error('   Pour utiliser Informix, vous devez installer:');
    console.error('   1. IBM Informix Client SDK');
    console.error('   2. Configurer ODBC Data Source');
    console.error('');
    console.error('   📖 Consultez le fichier INFORMIX_SETUP.md pour les instructions détaillées');
    console.error('');
    console.error('   Alternative: Utilisez MySQL en modifiant .env:');
    console.error('   DB_TYPE=mysql');
    console.error('');
    throw new Error('ODBC drivers not installed. See INFORMIX_SETUP.md for installation instructions.');
  }
}

// Build ODBC connection string for Informix
function buildConnectionString() {
  const { dsn, user, password } = informixConfig;

  // IMPORTANT: Sur Windows, node-odbc ne supporte pas correctement les connexions
  // manuelles avec Informix. Un DSN ODBC est OBLIGATOIRE.
  if (!dsn) {
    throw new Error(
      'DSN ODBC requis pour Informix sur Windows.\n' +
      'Configurez INFORMIX_DSN dans .env\n' +
      'Exemple: INFORMIX_DSN=lcb\n' +
      'Voir DSN_CONNECTION_GUIDE.md pour plus d\'informations.'
    );
  }

  console.log(`   Using DSN: ${dsn}`);
  return `DSN=${dsn};UID=${user};PWD=${password};`;
}

let pool = null;

// Create connection pool
async function createPool() {
  try {
    await loadOdbc();

    const connectionString = buildConnectionString();
    console.log('🔗 Creating Informix ODBC connection pool...');
    if (informixConfig.dsn) {
      console.log(`   DSN: ${informixConfig.dsn}`);
    } else {
      console.log(`   Host: ${informixConfig.host}:${informixConfig.port}`);
      console.log(`   Server: ${informixConfig.server}`);
      console.log(`   Database: ${informixConfig.database}`);
    }
    console.log(`   User: ${informixConfig.user}`);

    pool = await odbc.pool(connectionString);
    console.log('✅ Informix connection pool created successfully');

    return pool;
  } catch (error) {
    console.error('❌ Error creating Informix connection pool:', error.message);
    throw error;
  }
}

// Test connection
async function testConnection() {
  try {
    if (!pool) {
      await createPool();
    }

    const connection = await pool.connect();
    await connection.query('SELECT FIRST 1 * FROM systables');
    await connection.close();

    return {
      success: true,
      message: 'Informix connection successful'
    };
  } catch (error) {
    console.error('❌ Informix connection test failed:', error.message);
    return {
      success: false,
      message: 'Informix connection failed',
      error: error
    };
  }
}

// Get connection from pool
async function getConnection() {
  try {
    if (!pool) {
      await createPool();
    }
    return await pool.connect();
  } catch (error) {
    console.error('❌ Error getting Informix connection:', error.message);
    throw error;
  }
}

// Execute query
async function executeQuery(sql, params = []) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.query(sql, params);
    return result;
  } catch (error) {
    console.error('❌ Error executing Informix query:', error.message);
    console.error('   SQL:', sql);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Execute update/insert/delete
async function executeUpdate(sql, params = []) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.query(sql, params);
    return result;
  } catch (error) {
    console.error('❌ Error executing Informix update:', error.message);
    console.error('   SQL:', sql);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Close pool
async function closePool() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('✅ Informix connection pool closed');
    }
  } catch (error) {
    console.error('❌ Error closing Informix pool:', error);
  }
}

// Export functions
export default {
  createPool,
  testConnection,
  getConnection,
  executeQuery,
  executeUpdate,
  closePool,
  config: informixConfig
};
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

/**
 * MySQL Database Configuration and Connection Pool
 */
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bank_data_quality',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: '+00:00'
};

/**
 * Initialize MySQL connection pool
 */
export const initializeMySQLPool = () => {
  if (!pool) {
    console.log('🔌 Initializing MySQL connection pool...');
    console.log(`   Host: ${mysqlConfig.host}:${mysqlConfig.port}`);
    console.log(`   Database: ${mysqlConfig.database}`);

    pool = mysql.createPool(mysqlConfig);

    console.log('✅ MySQL connection pool created');
  }
  return pool;
};

/**
 * Get MySQL connection pool
 */
export const getMySQLPool = () => {
  if (!pool) {
    return initializeMySQLPool();
  }
  return pool;
};

/**
 * Test MySQL connection
 */
export const testMySQLConnection = async () => {
  try {
    const connection = await getMySQLPool().getConnection();
    console.log('🔍 Testing MySQL connection...');

    const [rows] = await connection.query('SELECT 1 as test');
    connection.release();

    if (rows && rows[0].test === 1) {
      console.log('✅ MySQL connection successful');
      return { success: true, message: 'MySQL connection successful' };
    } else {
      throw new Error('Unexpected response from MySQL');
    }
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    return { success: false, message: error.message, error };
  }
};

/**
 * Execute a query with parameters
 */
export const executeQuery = async (sql, params = []) => {
  try {
    const connection = await getMySQLPool().getConnection();
    try {
      const [rows] = await connection.query(sql, params);
      connection.release();
      return { success: true, data: rows };
    } catch (queryError) {
      connection.release();
      throw queryError;
    }
  } catch (error) {
    console.error('Query execution error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Execute multiple queries in a transaction
 */
export const executeTransaction = async (queries) => {
  const connection = await getMySQLPool().getConnection();

  try {
    await connection.beginTransaction();

    const results = [];
    for (const { sql, params } of queries) {
      const [rows] = await connection.query(sql, params);
      results.push(rows);
    }

    await connection.commit();
    connection.release();

    return { success: true, data: results };
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Transaction error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get client statistics
 */
export const getClientStats = async () => {
  const sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN tcli = '1' THEN 1 ELSE 0 END) as individual,
      SUM(CASE WHEN tcli = '2' THEN 1 ELSE 0 END) as corporate,
      SUM(CASE WHEN tcli = '3' THEN 1 ELSE 0 END) as institutional
    FROM bkcli
  `;

  return executeQuery(sql);
};

/**
 * Get validation metrics for a specific client type
 */
export const getValidationMetrics = async (clientType) => {
  let sql = '';

  if (clientType === '1') {
    sql = `
      SELECT
        COUNT(*) as total_records,
        SUM(CASE WHEN
          nid IS NOT NULL AND TRIM(nid) != '' AND
          nmer IS NOT NULL AND TRIM(nmer) != '' AND
          dna IS NOT NULL AND
          nat IS NOT NULL AND TRIM(nat) != '' AND
          nom IS NOT NULL AND TRIM(nom) != '' AND
          pre IS NOT NULL AND TRIM(pre) != '' AND
          sext IN ('M', 'F') AND
          viln IS NOT NULL AND TRIM(viln) != '' AND
          payn IS NOT NULL AND TRIM(payn) != '' AND
          tid IS NOT NULL AND TRIM(tid) != ''
        THEN 1 ELSE 0 END) as valid_records
      FROM bkcli WHERE tcli = '1'
    `;
  } else if (clientType === '2') {
    sql = `
      SELECT
        COUNT(*) as total_records,
        SUM(CASE WHEN
          rso IS NOT NULL AND TRIM(rso) != '' AND
          nrc IS NOT NULL AND TRIM(nrc) != '' AND
          datc IS NOT NULL AND
          sec IS NOT NULL AND TRIM(sec) != '' AND
          fju IS NOT NULL AND TRIM(fju) != '' AND
          catn IS NOT NULL AND TRIM(catn) != '' AND
          lienbq IS NOT NULL AND TRIM(lienbq) != ''
        THEN 1 ELSE 0 END) as valid_records
      FROM bkcli WHERE tcli = '2'
    `;
  } else if (clientType === '3') {
    sql = `
      SELECT
        COUNT(*) as total_records,
        SUM(CASE WHEN
          rso IS NOT NULL AND TRIM(rso) != '' AND
          nrc IS NOT NULL AND TRIM(nrc) != '' AND
          datc IS NOT NULL AND
          sec IS NOT NULL AND TRIM(sec) != '' AND
          fju IS NOT NULL AND TRIM(fju) != '' AND
          catn IS NOT NULL AND TRIM(catn) != '' AND
          lienbq IS NOT NULL AND TRIM(lienbq) != ''
        THEN 1 ELSE 0 END) as valid_records
      FROM bkcli WHERE tcli = '3'
    `;
  }

  const result = await executeQuery(sql);
  if (result.success && result.data.length > 0) {
    const { total_records, valid_records } = result.data[0];
    const quality_score = total_records > 0
      ? ((valid_records / total_records) * 100).toFixed(2)
      : 0;

    return {
      success: true,
      data: {
        total_records,
        valid_records,
        quality_score: parseFloat(quality_score)
      }
    };
  }

  return result;
};

/**
 * Get anomalies with pagination
 */
export const getAnomalies = async (clientType, page = 1, limit = 50, agencyCode = null) => {
  const offset = (page - 1) * limit;

  let whereConditions = [];
  let params = [];

  if (clientType && clientType !== 'all') {
    whereConditions.push('tcli = ?');
    params.push(clientType);
  }

  if (agencyCode) {
    whereConditions.push('age = ?');
    params.push(agencyCode);
  }

  // Add anomaly conditions based on client type
  if (clientType === '1') {
    whereConditions.push(`(
      nid IS NULL OR TRIM(nid) = '' OR
      nmer IS NULL OR TRIM(nmer) = '' OR
      dna IS NULL OR
      nat IS NULL OR TRIM(nat) = '' OR
      nom IS NULL OR TRIM(nom) = '' OR
      pre IS NULL OR TRIM(pre) = '' OR
      sext NOT IN ('M', 'F') OR
      viln IS NULL OR TRIM(viln) = '' OR
      payn IS NULL OR TRIM(payn) = '' OR
      tid IS NULL OR TRIM(tid) = ''
    )`);
  } else if (clientType === '2' || clientType === '3') {
    whereConditions.push(`(
      rso IS NULL OR TRIM(rso) = '' OR
      nrc IS NULL OR TRIM(nrc) = '' OR
      datc IS NULL OR
      sec IS NULL OR TRIM(sec) = '' OR
      fju IS NULL OR TRIM(fju) = '' OR
      catn IS NULL OR TRIM(catn) = '' OR
      lienbq IS NULL OR TRIM(lienbq) = ''
    )`);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // Get total count
  const countSql = `SELECT COUNT(*) as total FROM bkcli ${whereClause}`;
  const countResult = await executeQuery(countSql, params);
  const total = countResult.success ? countResult.data[0].total : 0;

  // Get paginated data
  const dataSql = `
    SELECT * FROM bkcli
    ${whereClause}
    ORDER BY cli
    LIMIT ? OFFSET ?
  `;
  const dataResult = await executeQuery(dataSql, [...params, limit, offset]);

  return {
    success: true,
    data: dataResult.data || [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get FATCA statistics
 */
export const getFATCAStats = async () => {
  const sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN fatca_status = 'À vérifier' THEN 1 ELSE 0 END) as to_verify,
      SUM(CASE WHEN fatca_status = 'Confirmé' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN fatca_status = 'Exclu' THEN 1 ELSE 0 END) as excluded,
      SUM(CASE WHEN fatca_status = 'En attente' THEN 1 ELSE 0 END) as pending
    FROM fatca_clients
  `;

  return executeQuery(sql);
};

/**
 * Get agency correction statistics
 */
export const getAgencyCorrectionStats = async () => {
  const sql = `
    SELECT
      agency_code,
      agency_name,
      total_anomalies,
      fixed_anomalies,
      in_review_anomalies,
      rejected_anomalies,
      correction_rate,
      last_updated
    FROM agency_correction_stats
    ORDER BY correction_rate DESC
    LIMIT 20
  `;

  return executeQuery(sql);
};

/**
 * Close MySQL connection pool
 */
export const closeMySQLPool = async () => {
  if (pool) {
    console.log('🔌 Closing MySQL connection pool...');
    await pool.end();
    pool = null;
    console.log('✅ MySQL connection pool closed');
  }
};

// Handle process termination
process.on('SIGTERM', closeMySQLPool);
process.on('SIGINT', closeMySQLPool);

export default {
  initializeMySQLPool,
  getMySQLPool,
  testMySQLConnection,
  executeQuery,
  executeTransaction,
  getClientStats,
  getValidationMetrics,
  getAnomalies,
  getFATCAStats,
  getAgencyCorrectionStats,
  closeMySQLPool
};

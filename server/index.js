import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';
import { createServer } from 'http';
import { AGENCIES, getAllAgencies } from './agencyData.js';
import { setupUserRoutes, authenticateToken, requireRole } from './userRoutes.js';
import { createDemoDataProvider } from './database.js';
import hybridDb from './hybridDatabase.js';
import compression from 'compression';
import reconciliationRoutes from './reconciliationEndpoints.js';
import { setupCoreBankingEndpoints } from './coreBankingEndpoints.js';

// Global error handlers for better debugging
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Stack trace:', reason?.stack);
  process.exit(1);
});

// Load environment variables
dotenv.config();

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// LDAP configuration (will be loaded from environment or database in production)
let ldapConfig = {
  enabled: false,
  url: 'ldap://your-domain-controller.com',
  baseDN: 'dc=example,dc=com',
  bindDN: 'cn=admin,dc=example,dc=com',
  bindCredentials: 'admin_password',
  userSearchBase: 'ou=users,dc=example,dc=com',
  userSearchFilter: '(sAMAccountName={{username}})',
  groupSearchBase: 'ou=groups,dc=example,dc=com',
  groupSearchFilter: '(member={{dn}})',
  adminGroup: 'CN=Admins,OU=Groups,DC=example,DC=com',
  auditorGroup: 'CN=Auditors,OU=Groups,DC=example,DC=com'
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression()); // Add compression for better performance

// Déterminer si on est en mode démo complet
const isDemoMode = process.env.DEMO_MODE === 'true';

// Architecture hybride: MySQL + Informix
let dataProvider;
let mysqlPool;
let informixPool;
let dbConfig;

// Initialiser la base de données hybride
if (isDemoMode) {
  console.log('🎭 Mode DEMO COMPLET activé - Données fictives (120k+ enregistrements)');
  dataProvider = createDemoDataProvider();

  mysqlPool = {
    getConnection: async () => ({
      query: async () => [[]],
      release: () => {}
    }),
    end: () => {}
  };

  dbConfig = {
    mysql: { available: false },
    informix: { available: false },
    demoProvider: dataProvider
  };
} else {
  console.log('🔄 Mode PRODUCTION - Architecture hybride');
  dbConfig = await hybridDb.initializeHybridDatabase();
  mysqlPool = dbConfig.mysql.pool;
  informixPool = dbConfig.informix.pool;
  dataProvider = dbConfig.demoProvider;
}

// Function to get MySQL connection (for auth, rules, users)
const getMySQLConnection = async () => {
  if (!dbConfig.mysql.available) {
    throw new Error('MySQL not available. Cannot perform authentication operations.');
  }
  try {
    return await mysqlPool.getConnection();
  } catch (error) {
    console.error('Error getting MySQL connection:', error);
    throw new Error('MySQL connection failed');
  }
};

// Legacy function for backward compatibility (defaults to MySQL for auth)
const getConnection = getMySQLConnection;

// Helper functions for data access
const getBusinessData = async (query, params = []) => {
  if (isDemoMode || !dbConfig.informix.available) {
    // Return null in demo mode, let endpoints use dataProvider directly
    return null;
  }
  return await hybridDb.executeInformixQuery(query, params);
};

const isBusinessDataAvailable = () => dbConfig.informix.available;

// Setup user routes (MySQL for authentication)
setupUserRoutes(app, getConnection);

// Setup CoreBanking configuration endpoints
setupCoreBankingEndpoints(app, authenticateToken, requireRole);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    let totalRecords = 0;

    if (isDemoMode) {
      // Use demo data
      const clientStats = dataProvider.getClientStats();
      totalRecords = clientStats.total;
    } else if (dbConfig.informix.available) {
      // Query Informix for total client count
      const result = await getBusinessData('SELECT COUNT(*) as count FROM bkcli');
      totalRecords = result[0].count;
    }

    res.json({
      status: 'ok',
      message: isDemoMode ? 'Server is running in demo mode' : 'Server is running with real Informix data',
      timestamp: new Date().toISOString(),
      totalRecords,
      mode: isDemoMode ? 'demo' : 'production',
      databases: {
        mysql: dbConfig.mysql.available ? 'connected' : 'disconnected',
        informix: dbConfig.informix.available ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Get client statistics
app.get('/api/stats/clients', async (req, res) => {
  try {
    if (isDemoMode || !isBusinessDataAvailable()) {
      // Use demo data
      const clientStats = dataProvider.getClientStats();
      return res.json(clientStats);
    }

    // Use Informix for business data
    const totalResult = await getBusinessData('SELECT COUNT(*) as count FROM bkcli');
    const individualResult = await getBusinessData("SELECT COUNT(*) as count FROM bkcli WHERE tcli = '1'");
    const corporateResult = await getBusinessData("SELECT COUNT(*) as count FROM bkcli WHERE tcli = '2'");
    const institutionalResult = await getBusinessData("SELECT COUNT(*) as count FROM bkcli WHERE tcli = '3'");

    // Calculate anomalies count with comprehensive rules
    const anomaliesResult = await getBusinessData(`
      SELECT COUNT(*) as count FROM bkcli
      WHERE
        (cli IS NULL OR TRIM(cli) = '' OR tcli NOT IN ('1', '2', '3') OR age IS NULL OR TRIM(age) = '')

        OR (tcli = '1' AND (
          nid IS NULL OR TRIM(nid) = '' OR
          (nid IS NOT NULL AND (LENGTH(nid) < 8 OR nid MATCHES '*123*' OR nid MATCHES '*XXX*' OR nid MATCHES '*000*')) OR
          nmer IS NULL OR TRIM(nmer) = '' OR
          dna IS NULL OR dna < MDY(1,1,1915) OR dna > CURRENT OR
          (vid IS NOT NULL AND vid < CURRENT) OR
          nat IS NULL OR TRIM(nat) = '' OR
          nom IS NULL OR TRIM(nom) = '' OR
          pre IS NULL OR TRIM(pre) = '' OR
          sext NOT IN ('M', 'F') OR
          viln IS NULL OR TRIM(viln) = '' OR
          payn IS NULL OR TRIM(payn) = '' OR
          tid IS NULL OR TRIM(tid) = ''
        ))

        OR (tcli = '2' AND (
          rso IS NULL OR TRIM(rso) = '' OR rso MATCHES '*123*' OR rso MATCHES '*XXX*' OR
          nrc IS NULL OR TRIM(nrc) = '' OR nrc MATCHES '*123*' OR nrc MATCHES '*XXX*' OR nrc MATCHES '*000*' OR
          datc IS NULL OR datc < MDY(1,1,1915) OR datc > CURRENT OR
          sec IS NULL OR TRIM(sec) = '' OR
          fju IS NULL OR TRIM(fju) = '' OR
          catn IS NULL OR TRIM(catn) = '' OR
          lienbq IS NULL OR TRIM(lienbq) = ''
        ))

        OR (tcli = '3' AND (
          rso IS NULL OR TRIM(rso) = '' OR rso MATCHES '*123*' OR rso MATCHES '*XXX*' OR
          nrc IS NULL OR TRIM(nrc) = '' OR nrc MATCHES '*123*' OR nrc MATCHES '*XXX*' OR nrc MATCHES '*000*' OR
          datc IS NULL OR datc < MDY(1,1,1915) OR datc > CURRENT OR
          sec IS NULL OR TRIM(sec) = '' OR
          fju IS NULL OR TRIM(fju) = '' OR
          catn IS NULL OR TRIM(catn) = '' OR
          lienbq IS NULL OR TRIM(lienbq) = ''
        ))
    `);

    // Get FATCA count
    const fatcaResult = await getBusinessData(`
      SELECT COUNT(*) as count FROM bkcli
      WHERE tcli = '1' AND (
        payn = 'US' OR nat = 'US' OR
        EXISTS (SELECT 1 FROM bkadcli WHERE bkadcli.cli = bkcli.cli AND bkadcli.cpay = 'US') OR
        EXISTS (SELECT 1 FROM bktelcli WHERE bktelcli.cli = bkcli.cli AND (
          bktelcli.num MATCHES '+1*' OR
          bktelcli.num MATCHES '001*' OR
          bktelcli.num MATCHES '+01*' OR
          bktelcli.num MATCHES '+001*'
        ))
      )
    `);

    res.json({
      total: totalResult[0].count,
      individual: individualResult[0].count,
      corporate: corporateResult[0].count,
      institutional: institutionalResult[0].count,
      anomalies: anomaliesResult[0].count,
      fatca: fatcaResult[0].count
    });
  } catch (error) {
    console.error('Error getting client statistics:', error);
    res.status(500).json({ error: 'Failed to retrieve client statistics' });
  }
});

// Get validation metrics
app.get('/api/validation-metrics', async (req, res) => {
  try {
    // TODO: Implement Informix query for validation metrics
    res.status(501).json({
      error: 'Not implemented',
      message: 'This endpoint requires Informix query implementation'
    });
  } catch (error) {
    console.error('Error getting validation metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve validation metrics' });
  }
});

// Get individual anomalies
app.get('/api/anomalies/individual', async (req, res) => {
  try {
    if (isDemoMode || !isBusinessDataAvailable()) {
      // Use demo data
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const anomalies = dataProvider.getIndividualAnomalies(page, limit);
      return res.json(anomalies);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Query Informix for individual anomalies
    const result = await getBusinessData(`
      SELECT FIRST ${limit} SKIP ${offset}
        cli, nid, nmer, nom, pre, dna, vid, nat, sext, viln, payn, tid, age
      FROM bkcli
      WHERE tcli = '1' AND (
        cli IS NULL OR TRIM(cli) = '' OR
        nid IS NULL OR TRIM(nid) = '' OR
        (nid IS NOT NULL AND (LENGTH(nid) < 8 OR nid MATCHES '*123*' OR nid MATCHES '*XXX*' OR nid MATCHES '*000*')) OR
        nmer IS NULL OR TRIM(nmer) = '' OR
        dna IS NULL OR dna < MDY(1,1,1915) OR dna > CURRENT OR
        (vid IS NOT NULL AND vid < CURRENT) OR
        nat IS NULL OR TRIM(nat) = '' OR
        nom IS NULL OR TRIM(nom) = '' OR
        pre IS NULL OR TRIM(pre) = '' OR
        sext NOT IN ('M', 'F') OR
        viln IS NULL OR TRIM(viln) = '' OR
        payn IS NULL OR TRIM(payn) = '' OR
        tid IS NULL OR TRIM(tid) = '' OR
        age IS NULL OR TRIM(age) = ''
      )
    `);

    const countResult = await getBusinessData(`
      SELECT COUNT(*) as count FROM bkcli
      WHERE tcli = '1' AND (
        cli IS NULL OR TRIM(cli) = '' OR
        nid IS NULL OR TRIM(nid) = '' OR
        (nid IS NOT NULL AND (LENGTH(nid) < 8 OR nid MATCHES '*123*' OR nid MATCHES '*XXX*' OR nid MATCHES '*000*')) OR
        nmer IS NULL OR TRIM(nmer) = '' OR
        dna IS NULL OR dna < MDY(1,1,1915) OR dna > CURRENT OR
        (vid IS NOT NULL AND vid < CURRENT) OR
        nat IS NULL OR TRIM(nat) = '' OR
        nom IS NULL OR TRIM(nom) = '' OR
        pre IS NULL OR TRIM(pre) = '' OR
        sext NOT IN ('M', 'F') OR
        viln IS NULL OR TRIM(viln) = '' OR
        payn IS NULL OR TRIM(payn) = '' OR
        tid IS NULL OR TRIM(tid) = '' OR
        age IS NULL OR TRIM(age) = ''
      )
    `);

    res.json({
      data: result,
      total: countResult[0].count,
      page,
      limit
    });
  } catch (error) {
    console.error('Error getting individual anomalies:', error);
    res.status(500).json({ error: 'Failed to retrieve individual anomalies' });
  }
});

// Get corporate anomalies
app.get('/api/anomalies/corporate', async (req, res) => {
  try {
    if (isDemoMode || !isBusinessDataAvailable()) {
      // Use demo data
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const anomalies = dataProvider.getCorporateAnomalies(page, limit);
      return res.json(anomalies);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Query Informix for corporate anomalies
    const result = await getBusinessData(`
      SELECT FIRST ${limit} SKIP ${offset}
        cli, rso, nrc, datc, sec, fju, catn, lienbq, age
      FROM bkcli
      WHERE tcli = '2' AND (
        cli IS NULL OR TRIM(cli) = '' OR
        rso IS NULL OR TRIM(rso) = '' OR rso MATCHES '*123*' OR rso MATCHES '*XXX*' OR
        nrc IS NULL OR TRIM(nrc) = '' OR nrc MATCHES '*123*' OR nrc MATCHES '*XXX*' OR nrc MATCHES '*000*' OR
        datc IS NULL OR datc < MDY(1,1,1915) OR datc > CURRENT OR
        sec IS NULL OR TRIM(sec) = '' OR
        fju IS NULL OR TRIM(fju) = '' OR
        catn IS NULL OR TRIM(catn) = '' OR
        lienbq IS NULL OR TRIM(lienbq) = '' OR
        age IS NULL OR TRIM(age) = ''
      )
    `);

    const countResult = await getBusinessData(`
      SELECT COUNT(*) as count FROM bkcli
      WHERE tcli = '2' AND (
        cli IS NULL OR TRIM(cli) = '' OR
        rso IS NULL OR TRIM(rso) = '' OR rso MATCHES '*123*' OR rso MATCHES '*XXX*' OR
        nrc IS NULL OR TRIM(nrc) = '' OR nrc MATCHES '*123*' OR nrc MATCHES '*XXX*' OR nrc MATCHES '*000*' OR
        datc IS NULL OR datc < MDY(1,1,1915) OR datc > CURRENT OR
        sec IS NULL OR TRIM(sec) = '' OR
        fju IS NULL OR TRIM(fju) = '' OR
        catn IS NULL OR TRIM(catn) = '' OR
        lienbq IS NULL OR TRIM(lienbq) = '' OR
        age IS NULL OR TRIM(age) = ''
      )
    `);

    res.json({
      data: result,
      total: countResult[0].count,
      page,
      limit
    });
  } catch (error) {
    console.error('Error getting corporate anomalies:', error);
    res.status(500).json({ error: 'Failed to retrieve corporate anomalies' });
  }
});

// Get institutional anomalies
app.get('/api/anomalies/institutional', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Query Informix for institutional anomalies
    const result = await getBusinessData(`
      SELECT FIRST ${limit} SKIP ${offset}
        cli, rso, nrc, datc, sec, fju, catn, lienbq, age
      FROM bkcli
      WHERE tcli = '3' AND (
        cli IS NULL OR TRIM(cli) = '' OR
        rso IS NULL OR TRIM(rso) = '' OR rso MATCHES '*123*' OR rso MATCHES '*XXX*' OR
        nrc IS NULL OR TRIM(nrc) = '' OR nrc MATCHES '*123*' OR nrc MATCHES '*XXX*' OR nrc MATCHES '*000*' OR
        datc IS NULL OR datc < MDY(1,1,1915) OR datc > CURRENT OR
        sec IS NULL OR TRIM(sec) = '' OR
        fju IS NULL OR TRIM(fju) = '' OR
        catn IS NULL OR TRIM(catn) = '' OR
        lienbq IS NULL OR TRIM(lienbq) = '' OR
        age IS NULL OR TRIM(age) = ''
      )
    `);

    const countResult = await getBusinessData(`
      SELECT COUNT(*) as count FROM bkcli
      WHERE tcli = '3' AND (
        cli IS NULL OR TRIM(cli) = '' OR
        rso IS NULL OR TRIM(rso) = '' OR rso MATCHES '*123*' OR rso MATCHES '*XXX*' OR
        nrc IS NULL OR TRIM(nrc) = '' OR nrc MATCHES '*123*' OR nrc MATCHES '*XXX*' OR nrc MATCHES '*000*' OR
        datc IS NULL OR datc < MDY(1,1,1915) OR datc > CURRENT OR
        sec IS NULL OR TRIM(sec) = '' OR
        fju IS NULL OR TRIM(fju) = '' OR
        catn IS NULL OR TRIM(catn) = '' OR
        lienbq IS NULL OR TRIM(lienbq) = '' OR
        age IS NULL OR TRIM(age) = ''
      )
    `);

    res.json({
      data: result,
      total: countResult[0].count,
      page,
      limit
    });
  } catch (error) {
    console.error('Error getting institutional anomalies:', error);
    res.status(500).json({ error: 'Failed to retrieve institutional anomalies' });
  }
});

// Get anomalies by branch
app.get('/api/anomalies/by-branch', async (req, res) => {
  try {
    // TODO: Implement Informix query for anomalies by branch
    res.status(501).json({
      error: 'Not implemented',
      message: 'This endpoint requires Informix query implementation'
    });
  } catch (error) {
    console.error('Error getting anomalies by branch:', error);
    res.status(500).json({ error: 'Failed to retrieve branch anomalies' });
  }
});

// Get agencies
app.get('/api/agencies', (req, res) => {
  try {
    const agencies = getAllAgencies();
    res.json(agencies);
  } catch (error) {
    console.error('Error getting agencies:', error);
    res.status(500).json({ error: 'Failed to retrieve agencies' });
  }
});

// Get FATCA statistics
app.get('/api/fatca/stats', async (req, res) => {
  try {
    // TODO: Implement Informix query for FATCA statistics
    res.status(501).json({
      error: 'Not implemented',
      message: 'This endpoint requires Informix query implementation'
    });
  } catch (error) {
    console.error('Error getting FATCA statistics:', error);
    res.status(500).json({ error: 'Failed to retrieve FATCA statistics' });
  }
});

// Get FATCA clients
app.get('/api/fatca/clients', async (req, res) => {
  try {
    if (isDemoMode || !isBusinessDataAvailable()) {
      // Use demo data
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const fatcaClients = dataProvider.getFatcaClients(page, limit);
      return res.json(fatcaClients);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Query Informix for FATCA clients
    const result = await getBusinessData(`
      SELECT FIRST ${limit} SKIP ${offset}
        cli, nom, pre, dna, nat, payn, age
      FROM bkcli
      WHERE tcli = '1' AND (
        payn = 'US' OR nat = 'US' OR
        EXISTS (SELECT 1 FROM bkadcli WHERE bkadcli.cli = bkcli.cli AND bkadcli.cpay = 'US') OR
        EXISTS (SELECT 1 FROM bktelcli WHERE bktelcli.cli = bkcli.cli AND (
          bktelcli.num MATCHES '+1*' OR
          bktelcli.num MATCHES '001*' OR
          bktelcli.num MATCHES '+01*' OR
          bktelcli.num MATCHES '+001*'
        ))
      )
    `);

    const countResult = await getBusinessData(`
      SELECT COUNT(*) as count FROM bkcli
      WHERE tcli = '1' AND (
        payn = 'US' OR nat = 'US' OR
        EXISTS (SELECT 1 FROM bkadcli WHERE bkadcli.cli = bkcli.cli AND bkadcli.cpay = 'US') OR
        EXISTS (SELECT 1 FROM bktelcli WHERE bktelcli.cli = bkcli.cli AND (
          bktelcli.num MATCHES '+1*' OR
          bktelcli.num MATCHES '001*' OR
          bktelcli.num MATCHES '+01*' OR
          bktelcli.num MATCHES '+001*'
        ))
      )
    `);

    res.json({
      data: result,
      total: countResult[0].count,
      page,
      limit
    });
  } catch (error) {
    console.error('Error getting FATCA clients:', error);
    res.status(500).json({ error: 'Failed to retrieve FATCA clients' });
  }
});

// Get corporate FATCA clients
app.get('/api/fatca/corporate', async (req, res) => {
  try {
    if (isDemoMode || !isBusinessDataAvailable()) {
      // Use demo data
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const fatcaCorporate = dataProvider.getCorporateFatcaClients(page, limit);
      return res.json(fatcaCorporate);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Query Informix for corporate FATCA clients
    const result = await getBusinessData(`
      SELECT FIRST ${limit} SKIP ${offset}
        cli, rso, nrc, datc, age
      FROM bkcli
      WHERE tcli = '2' AND (
        payn = 'US' OR
        EXISTS (SELECT 1 FROM bkadcli WHERE bkadcli.cli = bkcli.cli AND bkadcli.cpay = 'US')
      )
    `);

    const countResult = await getBusinessData(`
      SELECT COUNT(*) as count FROM bkcli
      WHERE tcli = '2' AND (
        payn = 'US' OR
        EXISTS (SELECT 1 FROM bkadcli WHERE bkadcli.cli = bkcli.cli AND bkadcli.cpay = 'US')
      )
    `);

    res.json({
      data: result,
      total: countResult[0].count,
      page,
      limit
    });
  } catch (error) {
    console.error('Error getting corporate FATCA clients:', error);
    res.status(500).json({ error: 'Failed to retrieve corporate FATCA clients' });
  }
});

// Get FATCA indicators
app.get('/api/fatca/indicators', async (req, res) => {
  try {
    // TODO: Implement Informix query for FATCA indicators
    res.status(501).json({
      error: 'Not implemented',
      message: 'This endpoint requires Informix query implementation'
    });
  } catch (error) {
    console.error('Error getting FATCA indicators:', error);
    res.status(500).json({ error: 'Failed to retrieve FATCA indicators' });
  }
});

// Get agency correction stats
app.get('/api/agency-correction-stats', async (req, res) => {
  try {
    // TODO: Implement Informix query for agency correction stats
    res.status(501).json({
      error: 'Not implemented',
      message: 'This endpoint requires Informix query implementation'
    });
  } catch (error) {
    console.error('Error getting agency correction stats:', error);
    res.status(500).json({ error: 'Failed to retrieve agency correction stats' });
  }
});

// Get weekly correction stats
app.get('/api/correction-stats/weekly', async (req, res) => {
  try {
    // TODO: Implement Informix query for weekly correction stats
    res.status(501).json({
      error: 'Not implemented',
      message: 'This endpoint requires Informix query implementation'
    });
  } catch (error) {
    console.error('Error getting weekly correction stats:', error);
    res.status(500).json({ error: 'Failed to retrieve weekly correction stats' });
  }
});

// Get data load history
app.get('/api/data-load-history', async (req, res) => {
  try {
    // TODO: Implement Informix query for data load history
    res.status(501).json({
      error: 'Not implemented',
      message: 'This endpoint requires Informix query implementation'
    });
  } catch (error) {
    console.error('Error getting data load history:', error);
    res.status(500).json({ error: 'Failed to retrieve data load history' });
  }
});

// Get users by agency
app.get('/api/users/by-agency', authenticateToken, requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    // Query MySQL for users by agency
    const connection = await getMySQLConnection();
    const [users] = await connection.query(`
      SELECT u.id, u.username, u.email, u.role, u.agency_code, a.name as agency_name
      FROM users u
      LEFT JOIN agencies a ON u.agency_code = a.code
      WHERE u.agency_code IS NOT NULL
      ORDER BY u.agency_code, u.username
    `);
    connection.release();

    res.json(users);
  } catch (error) {
    console.error('Error getting users by agency:', error);
    res.status(500).json({ error: 'Failed to retrieve users by agency' });
  }
});

// Get global tracking data
app.get('/api/tracking/global', authenticateToken, async (req, res) => {
  try {
    // TODO: Implement Informix query for global tracking data
    res.status(501).json({
      error: 'Not implemented',
      message: 'This endpoint requires Informix query implementation'
    });
  } catch (error) {
    console.error('Error getting global tracking data:', error);
    res.status(500).json({ error: 'Failed to retrieve global tracking data' });
  }
});

// Clear cache
app.post('/api/cache/clear', authenticateToken, (req, res) => {
  try {
    // In a real application, this would clear any caching mechanism
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Reconciliation routes
app.use('/api/reconciliation', authenticateToken, reconciliationRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}
  
// Always serve the SPA for any route not explicitly handled
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } else {
    // In development, redirect to the dev server
    res.redirect('http://localhost:5175');
  }
});

// Start the server
const server = createServer(app);
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access the application at: http://127.0.0.1:${PORT}`);
  console.log('');
  if (isDemoMode) {
    console.log('🎭 DEMO MODE ACTIVE: Using fictional data (120k+ records)');
  } else {
    console.log('✅ PRODUCTION MODE: Using real Informix data');
  }
  console.log('');

  console.log('🔐 Authentication endpoints:');
  console.log('   • GET  /api/setup - Database setup');
  console.log('   • POST /api/auth/login - User login');
  console.log('   • GET  /api/auth/ldap-config - Get LDAP configuration');
  console.log('   • POST /api/auth/ldap-config - Update LDAP configuration');
  console.log('   • POST /api/auth/test-ldap - Test LDAP connection');
  console.log('');

  if (isDemoMode) {
    console.log('📋 Demo accounts (no database required):');
    console.log('   • admin@bsic.ci / admin123 (Administrateur)');
    console.log('   • auditor@bsic.ci / auditor123 (Auditeur)');
    console.log('   • ag001@bsic.ci / ag001pass (Utilisateur Agence)');
    console.log('');
  } else if (dbConfig.mysql.available) {
    console.log('📋 Available test accounts:');
    console.log('   • admin / admin123 (Administrateur)');
    console.log('   • auditor / admin123 (Auditeur)');
    console.log('   • user / admin123 (Utilisateur)');
    console.log('   • agency_01001 / agency01001 (Utilisateur Agence Ganhi)');
    console.log('   • agency_01002 / agency01002 (Utilisateur Agence Haie Vive)');
    console.log('   • agency_01003 / agency01003 (Utilisateur Agence Cadjehoun)');
    console.log('');
  }

  console.log('📊 Data endpoints:');
  console.log('   • GET  /api/health - Health check');
  console.log('   • GET  /api/stats/clients - Client statistics');
  console.log('   • GET  /api/anomalies/individual - Individual anomalies');
  console.log('   • GET  /api/anomalies/corporate - Corporate anomalies');
  console.log('   • GET  /api/anomalies/institutional - Institutional anomalies');
  console.log('   • GET  /api/anomalies/by-branch - Branch anomalies');
  console.log('   • GET  /api/agencies - Agency list');
  console.log('   • GET  /api/validation-metrics - Validation metrics');
  console.log('   • GET  /api/fatca/clients - FATCA clients');
  console.log('   • GET  /api/fatca/corporate - Corporate FATCA clients');
  console.log('   • GET  /api/fatca/stats - FATCA statistics');
  console.log('   • GET  /api/fatca/indicators - FATCA indicators');
  console.log('   • GET  /api/agency-correction-stats - Agency correction stats');
  console.log('   • GET  /api/correction-stats/weekly - Weekly correction stats');
  console.log('   • GET  /api/data-load-history - Data load history');
  console.log('   • GET  /api/users/by-agency - Users by agency');
  console.log('   • GET  /api/tracking/global - Global tracking data');
  console.log('');

  console.log(`🌐 Server accessible at http://localhost:${PORT}`);
  console.log('🗄️ Database status:');
  console.log(`   MySQL (Auth): ${dbConfig.mysql.available ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`   Informix (Data): ${dbConfig.informix.available ? '✅ Connected' : '❌ Disconnected'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
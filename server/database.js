import { AGENCIES, getAllAgencies } from './agencyData.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mysql from 'mysql2/promise';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a demo data provider for the presentation
export const createDemoDataProvider = () => {
  console.log('🎭 Using demo data provider with sample data');
  let demoData;

  // Load demo data from JSON file
  const demoDataPath = path.join(__dirname, 'demo-data.json');

  try {
    if (fs.existsSync(demoDataPath)) {
      const rawData = fs.readFileSync(demoDataPath, 'utf8');
      demoData = JSON.parse(rawData);
      console.log('✅ Loaded demo data from file');
    } else {
      console.log('⚠️ Demo data file not found, creating default data');
      demoData = createDefaultDemoData();

      try {
        // Save the generated data for future use
        fs.writeFileSync(demoDataPath, JSON.stringify(demoData, null, 2));
        console.log('✅ Created and saved demo data');
      } catch (saveError) {
        console.error('❌ Error saving demo data:', saveError);
        console.log('⚠️ Continuing with in-memory demo data');
      }
    }
  } catch (error) {
    console.error('❌ Error loading demo data:', error);
    demoData = createDefaultDemoData();
    console.log('✅ Created default demo data in memory');
  }

  console.log('🎭 Demo data provider created successfully');

  return {
    getDemoData: () => demoData,
    getClientStats: () => demoData.clientStats,
    getValidationMetrics: () => demoData.validationMetrics,
    getIndividualAnomalies: (page = 1, limit = 10) => {
      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        data: demoData.individualAnomalies.slice(start, end),
        total: demoData.individualAnomalies.length,
        page,
        limit
      };
    },
    getCorporateAnomalies: (page = 1, limit = 10) => {
      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        data: demoData.corporateAnomalies.slice(start, end),
        total: demoData.corporateAnomalies.length,
        page,
        limit
      };
    },
    getInstitutionalAnomalies: (page = 1, limit = 10) => {
      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        data: demoData.institutionalAnomalies.slice(start, end),
        total: demoData.institutionalAnomalies.length,
        page,
        limit
      };
    },
    getAnomaliesByBranch: () => demoData.branchAnomalies,
    getFatcaStats: () => demoData.fatcaStats,
    getFatcaClients: (page = 1, limit = 10) => {
      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        data: demoData.fatcaClients.slice(start, end),
        total: demoData.fatcaClients.length,
        page,
        limit
      };
    },
    getCorporateFatcaClients: (page = 1, limit = 10) => {
      const start = (page - 1) * limit;
      const end = start + limit;
      // Filter for corporate clients (tcli = '2')
      const corporateFatca = demoData.fatcaClients.filter(client => client.cli.startsWith('ENT'));
      return {
        data: corporateFatca.slice(start, end),
        total: corporateFatca.length,
        page,
        limit
      };
    },
    getFatcaIndicators: () => demoData.fatcaIndicators,
    getAgencyCorrectionStats: () => demoData.agencyCorrectionStats,
    getWeeklyCorrectionStats: () => demoData.weeklyCorrectionStats,
    getDataLoadHistory: () => demoData.dataLoadHistory,
    getUsersByAgency: () => demoData.usersByAgency,
    getGlobalTrackingData: () => demoData.globalTrackingData
  };
};

// Create default demo data
function createDefaultDemoData() {
  // Generate client statistics
  const clientStats = {
    total: 325037,
    individual: 290000,
    corporate: 30000,
    institutional: 5037,
    anomalies: 55000,
    fatca: 12470
  };

  // Generate validation metrics
  const validationMetrics = [
    {
      category: 'Clients Particuliers',
      total_records: 290000,
      valid_records: 238120,
      quality_score: 82.11
    },
    {
      category: 'Clients Entreprises',
      total_records: 30000,
      valid_records: 26364,
      quality_score: 87.88
    },
    {
      category: 'Clients Institutionnels',
      total_records: 5037,
      valid_records: 4667,
      quality_score: 92.65
    }
  ];

  // Generate individual anomalies
  const individualAnomalies = [];
  for (let i = 1; i <= 1000; i++) {
    const anomaly = {
      cli: `CLI${String(i).padStart(6, '0')}`,
      nom: `CLIENT ${i % 2 === 0 ? 'DIALLO' : 'TRAORE'} ${i}`,
      tcli: '1',
      pre: `${i % 2 === 0 ? 'Mamadou' : 'Fatoumata'}`,
      nid: i % 5 === 0 ? '' : `ID${String(i).padStart(8, '0')}`,
      nmer: i % 7 === 0 ? '' : `MERE DE ${i}`,
      dna: i % 6 === 0 ? '' : `${1960 + (i % 40)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      nat: i % 8 === 0 ? '' : 'ML',
      age: `${String(i % 50 + 1).padStart(5, '0')}`,
      sext: i % 2 === 0 ? 'M' : 'F',
      viln: i % 9 === 0 ? '' : 'BAMAKO',
      payn: i % 10 === 0 ? 'US' : 'ML',
      tid: i % 11 === 0 ? '' : 'CNI'
    };
    individualAnomalies.push(anomaly);
  }

  // Generate corporate anomalies
  const corporateAnomalies = [];
  for (let i = 1; i <= 500; i++) {
    const anomaly = {
      cli: `ENT${String(i).padStart(6, '0')}`,
      nom: `ENTREPRISE ${i}`,
      tcli: '2',
      nrc: i % 5 === 0 ? '' : `RC${String(i).padStart(8, '0')}`,
      datc: i % 6 === 0 ? '' : `${1990 + (i % 30)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      rso: i % 7 === 0 ? '' : `SOCIETE ${i} SARL`,
      age: `${String(i % 50 + 1).padStart(5, '0')}`,
      sig: i % 8 === 0 ? 'S' + i : '',
      sec: i % 9 === 0 ? '' : `SECTEUR ${i % 10 + 1}`,
      fju: i % 10 === 0 ? '' : 'SARL',
      catn: i % 11 === 0 ? '' : 'PME',
      lienbq: i % 12 === 0 ? '' : 'CLIENT'
    };
    corporateAnomalies.push(anomaly);
  }

  // Generate institutional anomalies
  const institutionalAnomalies = [];
  for (let i = 1; i <= 200; i++) {
    const anomaly = {
      cli: `INST${String(i).padStart(6, '0')}`,
      nom: `INSTITUTION ${i}`,
      tcli: '3',
      nrc: i % 5 === 0 ? '' : `INST${String(i).padStart(8, '0')}`,
      datc: i % 6 === 0 ? '' : `${1980 + (i % 40)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      rso: i % 7 === 0 ? '' : `INSTITUTION ${i}`,
      age: `${String(i % 50 + 1).padStart(5, '0')}`,
      sec: i % 9 === 0 ? '' : `SECTEUR ${i % 5 + 1}`,
      fju: i % 10 === 0 ? '' : 'EPIC',
      catn: i % 11 === 0 ? '' : 'INST',
      lienbq: i % 12 === 0 ? '' : 'PARTENAIRE'
    };
    institutionalAnomalies.push(anomaly);
  }

  // Generate branch anomalies
  const branchAnomalies = [];
  const agencies = getAllAgencies();

  agencies.slice(0, 20).forEach((agency, index) => {
    branchAnomalies.push({
      code_agence: agency.code_agence,
      lib_agence: agency.lib_agence,
      nombre_anomalies: Math.floor(Math.random() * 5000) + 500
    });
  });

  // Sort by number of anomalies
  branchAnomalies.sort((a, b) => b.nombre_anomalies - a.nombre_anomalies);

  // Generate FATCA stats
  const fatcaStats = {
    total: 1250,
    individual: 850,
    corporate: 400,
    toVerify: 850,
    confirmed: 320,
    excluded: 80,
    pending: 0,
    currentMonth: 125
  };

  // Generate FATCA clients
  const fatcaClients = [];
  for (let i = 1; i <= 200; i++) {
    const client = {
      cli: `CLI${String(i + 5000).padStart(6, '0')}`,
      nom: `CLIENT FATCA ${i}`,
      date_entree_relation: `${2020 + (i % 5)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      status_client: i % 3 === 0 ? 'Ancien Client' : 'Client Actif',
      pays_naissance: i % 5 === 0 ? 'US' : 'ML',
      nationalite: i % 7 === 0 ? 'US' : 'ML',
      adresse: `${i} ${i % 2 === 0 ? 'Main Street, New York' : 'Avenue des Fleurs, Bamako'}`,
      pays_adresse: i % 9 === 0 ? 'US' : 'ML',
      telephone: i % 11 === 0 ? `+1 555-${String(i).padStart(3, '0')}-${String(i * 4).padStart(4, '0')}` : `+223 ${String(i * 7).padStart(8, '0')}`,
      relation_client: i % 10 === 0 ? `CLI${String(i+100).padStart(6, '0')}` : '',
      type_relation: i % 10 === 0 ? (i % 20 === 0 ? 'Familiale' : 'Joint') : '',
      fatca_status: i % 4 === 0 ? 'Confirmé' : i % 4 === 1 ? 'Exclu' : 'À vérifier',
      fatca_date: i % 4 < 2 ? `${2024}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}` : null,
      fatca_uti: i % 4 < 2 ? 'admin' : null,
      notes: i % 4 < 2 ? 'Vérification complète effectuée' : null
    };
    fatcaClients.push(client);
  }

  // Generate FATCA indicators
  const fatcaIndicators = {
    nationality: 425,
    birthplace: 300,
    address: 250,
    phone: 180,
    proxy: 60
  };

  // Generate agency correction stats
  const agencyCorrectionStats = [];
  agencies.slice(0, 20).forEach((agency, index) => {
    const totalAnomalies = Math.floor(Math.random() * 5000) + 500;
    const fixedAnomalies = Math.floor(Math.random() * totalAnomalies);
    const inReviewAnomalies = Math.floor(Math.random() * (totalAnomalies - fixedAnomalies));
    const rejectedAnomalies = Math.floor(Math.random() * (totalAnomalies - fixedAnomalies - inReviewAnomalies));

    agencyCorrectionStats.push({
      agency_code: agency.code_agence,
      agency_name: agency.lib_agence,
      total_anomalies: totalAnomalies,
      fixed_anomalies: fixedAnomalies,
      in_review_anomalies: inReviewAnomalies,
      rejected_anomalies: rejectedAnomalies,
      correction_rate: parseFloat(((fixedAnomalies / totalAnomalies) * 100).toFixed(2)),
      last_updated: new Date().toISOString()
    });
  });

  // Sort by correction rate
  agencyCorrectionStats.sort((a, b) => b.correction_rate - a.correction_rate);

  // Generate weekly correction stats
  const weeklyCorrectionStats = [];
  const statuses = ['detected', 'in_review', 'fixed', 'rejected'];

  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (12 - i) * 7);

    const yearWeek = `${date.getFullYear()}${Math.floor(i / 4) + 1}`;
    const weekLabel = `${date.getFullYear()}-W${String(Math.floor(i / 4) + 1).padStart(2, '0')}`;

    statuses.forEach(status => {
      let count;
      switch (status) {
        case 'detected':
          count = Math.floor(Math.random() * 100) + 50;
          break;
        case 'in_review':
          count = Math.floor(Math.random() * 80) + 20;
          break;
        case 'fixed':
          count = Math.floor(Math.random() * 60) + 10;
          break;
        case 'rejected':
          count = Math.floor(Math.random() * 20) + 5;
          break;
        default:
          count = 0;
      }

      weeklyCorrectionStats.push({
        year_week: yearWeek,
        week_label: weekLabel,
        status,
        count
      });
    });
  }

  // Generate data load history
  const dataLoadHistory = [];
  const tables = ['bkcli', 'bkcom', 'bkadcli', 'bktelcli', 'bkemacli', 'bkcoj', 'bkpscm'];
  const users = ['admin', 'system', 'batch_process'];

  for (let i = 0; i < 20; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const table = tables[Math.floor(Math.random() * tables.length)];
    const status = Math.random() > 0.2 ? 'success' : (Math.random() > 0.5 ? 'warning' : 'error');
    const recordsCount = Math.floor(Math.random() * 10000) + 1000;
    const executionTime = Math.floor(Math.random() * 60000) + 1000;

    dataLoadHistory.push({
      id: i + 1,
      table_name: table,
      records_count: status === 'success' ? recordsCount : 0,
      load_date: date.toISOString(),
      load_status: status,
      error_message: status === 'error' ? 'Erreur de connexion à la base de données' : null,
      loaded_by: users[Math.floor(Math.random() * users.length)],
      execution_time_ms: executionTime
    });
  }

  // Generate users by agency
  const usersByAgency = [];

  for (let i = 1; i <= 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    usersByAgency.push({
      agency_code: `0${1200 + i}`,
      user_count: Math.floor(Math.random() * 5) + 1,
      last_activity: Math.random() > 0.2 ? date.toISOString() : null
    });
  }

  // Generate global tracking data
  const globalTrackingData = [];

  agencies.slice(0, 20).forEach((agency, index) => {
    const fluxTotal = Math.floor(Math.random() * 1000) + 100;
    const fluxAnomalies = Math.floor(fluxTotal * (Math.random() * 0.3 + 0.1));
    const fluxFiabilises = Math.floor(fluxAnomalies * (Math.random() * 0.8 + 0.1));

    const stockActifs = Math.floor(Math.random() * 10000) + 1000;
    const stockAnomalies = Math.floor(stockActifs * (Math.random() * 0.3 + 0.1));
    const stockFiabilises = Math.floor(stockAnomalies * (Math.random() * 0.8 + 0.1));

    const tauxAnomalies = parseFloat(((stockAnomalies / stockActifs) * 100).toFixed(1));
    const tauxFiabilisation = parseFloat(((stockFiabilises / stockAnomalies) * 100).toFixed(1));

    globalTrackingData.push({
      agencyCode: agency.code_agence,
      agencyName: agency.lib_agence,
      flux: {
        total: fluxTotal,
        anomalies: fluxAnomalies,
        fiabilises: fluxFiabilises
      },
      stock: {
        actifs: stockActifs,
        anomalies: stockAnomalies,
        fiabilises: stockFiabilises
      },
      general: {
        actifs: stockActifs,
        anomalies: stockAnomalies,
        fiabilises: stockFiabilises
      },
      indicators: {
        tauxAnomalies,
        tauxFiabilisation
      }
    });
  });

  return {
    clientStats,
    validationMetrics,
    individualAnomalies,
    corporateAnomalies,
    institutionalAnomalies,
    branchAnomalies,
    fatcaStats,
    fatcaClients,
    fatcaIndicators,
    agencyCorrectionStats,
    weeklyCorrectionStats,
    dataLoadHistory,
    usersByAgency,
    globalTrackingData,
    lastUpdated: new Date().toISOString()
  };
}

// Legacy MySQL pool creation for backward compatibility
export const createPool = (options = {}) => {
  try {
    const poolConfig = {
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
      ...options
    };

    console.log('🔗 Creating MySQL connection pool...');
    console.log(`   Host: ${poolConfig.host}:${poolConfig.port}`);
    console.log(`   Database: ${poolConfig.database}`);
    console.log(`   User: ${poolConfig.user}`);

    const pool = mysql.createPool(poolConfig);

    pool.getConnection()
        .then(connection => {
          console.log('✅ MySQL connection test successful');
          connection.release();
        })
        .catch(error => {
          console.error('❌ MySQL connection test failed:', error.message);
        });

    return pool;
  } catch (error) {
    console.error('❌ Error creating MySQL pool:', error);
    throw error;
  }
};

export default { createDemoDataProvider, createPool };
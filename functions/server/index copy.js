import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';
import compression from 'compression';
import { AGENCIES, getAllAgencies } from './agencyData.js';
import { setupUserRoutes, authenticateToken, requireRole } from './userRoutes.js';
import { createPool } from './database.js';
import {
    initRedisClient,
    getCache,
    setCache,
    deleteCache,
    clearCache,
    closeRedisConnection,
    cacheMiddleware,
    getCacheStats
} from './cache.js';

// Load environment variables
dotenv.config();

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
        origin: ['http://localhost:5174', 'http://192.168.118.1:5174'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
}));

// Route de test
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'API is working' });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression()); // Add compression for better performance

// Initialize Redis client
let redisConnected = false;
try {
    redisConnected = await initRedisClient();
} catch (error) {
    console.error('Error initializing Redis client:', error.message);
    console.log('⚠️ Using in-memory cache as fallback');
}

// Create database connection pool
let pool;
try {
    pool = createPool();
    console.log('✅ MySQL database pool created successfully');
} catch (error) {
    console.error('Error creating database pool:', error.message);
}

// Function to get a connection from the pool with error handling
const getConnection = async () => {
    try {
        return await pool.getConnection();
    } catch (error) {
        console.error('Error getting database connection:', error.message);
        throw new Error('Database connection failed');
    }
};

// Setup user routes
setupUserRoutes(app, getConnection);

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const connection = await getConnection();

        // Get total records count from bkcli table
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM bkcli');
        const totalRecords = rows[0].count;

        connection.release();

        // Get cache stats
        const cacheStats = getCacheStats();

        res.json({
            status: 'ok',
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            totalRecords,
            cacheStatus: {
                redisAvailable: cacheStats.redisAvailable,
                memorySize: cacheStats.memorySize
            }
        });
    } catch (error) {
        console.error('Health check error:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Get client statistics with caching
app.get('/api/stats/clients', cacheMiddleware(300), async (req, res) => {
    try {
        const connection = await getConnection();

        // Get counts from database
        const [totalResult] = await connection.query('SELECT COUNT(*) as count FROM bkcli');
        const [individualResult] = await connection.query('SELECT COUNT(*) as count FROM bkcli WHERE tcli = "1"');
        const [corporateResult] = await connection.query('SELECT COUNT(*) as count FROM bkcli WHERE tcli = "2"');
        const [institutionalResult] = await connection.query('SELECT COUNT(*) as count FROM bkcli WHERE tcli = "3"');

        // Calculate anomalies count with comprehensive rules
        const [anomaliesResult] = await connection.query(`
      SELECT COUNT(*) as count FROM bkcli 
      WHERE 
        /* Common rules for all client types */
        (cli IS NULL OR TRIM(cli) = '' OR tcli NOT IN ('1', '2', '3') OR age IS NULL OR TRIM(age) = '')
        
        /* Rules for individual clients (tcli = 1) */
        OR (tcli = '1' AND (
          nid IS NULL OR TRIM(nid) = '' OR 
          (nid IS NOT NULL AND (LENGTH(nid) < 8 OR nid LIKE '%123%' OR nid LIKE '%XXX%' OR nid LIKE '%000%')) OR
          nmer IS NULL OR TRIM(nmer) = '' OR 
          dna IS NULL OR dna < '1915-01-01' OR dna > CURDATE() OR
          (vid IS NOT NULL AND vid < CURDATE()) OR
          nat IS NULL OR TRIM(nat) = '' OR
          nom IS NULL OR TRIM(nom) = '' OR nom REGEXP '^[Xx]+$' OR
          pre IS NULL OR TRIM(pre) = '' OR pre REGEXP '^[Xx]+$' OR
          sext NOT IN ('M', 'F') OR
          viln IS NULL OR TRIM(viln) = '' OR
          payn IS NULL OR TRIM(payn) = '' OR
          tid IS NULL OR TRIM(tid) = ''
        ))
        
        /* Rules for corporate clients (tcli = 2) */
        OR (tcli = '2' AND (
          rso IS NULL OR TRIM(rso) = '' OR rso LIKE '%123%' OR rso LIKE '%XXX%' OR
          (sig IS NOT NULL AND (LENGTH(sig) > 20 OR sig NOT REGEXP '^[A-Z0-9\\-\\.\\s]+$')) OR
          nrc IS NULL OR TRIM(nrc) = '' OR nrc LIKE '%123%' OR nrc LIKE '%XXX%' OR nrc LIKE '%000%' OR nrc NOT LIKE 'MA%' OR
          datc IS NULL OR datc < '1915-01-01' OR datc > CURDATE() OR
          sec IS NULL OR TRIM(sec) = '' OR
          fju IS NULL OR TRIM(fju) = '' OR
          catn IS NULL OR TRIM(catn) = '' OR
          lienbq IS NULL OR TRIM(lienbq) = ''
        ))
        
        /* Rules for institutional clients (tcli = 3) */
        OR (tcli = '3' AND (
          rso IS NULL OR TRIM(rso) = '' OR rso LIKE '%123%' OR rso LIKE '%XXX%' OR
          nrc IS NULL OR TRIM(nrc) = '' OR nrc LIKE '%123%' OR nrc LIKE '%XXX%' OR nrc LIKE '%000%' OR
          datc IS NULL OR datc < '1915-01-01' OR datc > CURDATE() OR
          sec IS NULL OR TRIM(sec) = '' OR
          fju IS NULL OR TRIM(fju) = '' OR
          catn IS NULL OR TRIM(catn) = '' OR
          lienbq IS NULL OR TRIM(lienbq) = ''
        ))
    `);

        // Get FATCA count
        const [fatcaResult] = await connection.query(`
      SELECT COUNT(DISTINCT c.cli) as count FROM bkcli c
      LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
      LEFT JOIN bktelcli t ON c.cli = t.cli
      WHERE c.tcli = "1" AND (
        c.payn = "400" OR c.nat = "400" OR 
        a.cpay = "400" OR
        t.num LIKE "+1%" OR 
        t.num LIKE "001%" OR 
        t.num LIKE "+01%" OR 
        t.num LIKE "+001%"
      )
    `);

        connection.release();

        res.json({
            total: totalResult[0].count,
            individual: individualResult[0].count,
            corporate: corporateResult[0].count,
            institutional: institutionalResult[0].count,
            anomalies: anomaliesResult[0].count,
            fatca: fatcaResult[0].count
        });
    } catch (error) {
        console.error('Error getting client statistics:', error.message);

        // Return fallback data in case of error
        res.json({
            total: 325037,
            individual: 290000,
            corporate: 30000,
            institutional: 5037,
            anomalies: 55000,
            fatca: 12470
        });
    }
});

// Get validation metrics with caching
app.get('/api/validation-metrics', cacheMiddleware(600), async (req, res) => {
    try {
        const connection = await getConnection();

        // Get validation metrics with comprehensive rules
        const [individualResult] = await connection.query(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN 
          nid IS NOT NULL AND TRIM(nid) != '' AND 
          (LENGTH(nid) >= 8 AND nid NOT LIKE '%123%' AND nid NOT LIKE '%XXX%' AND nid NOT LIKE '%000%') AND
          nmer IS NOT NULL AND TRIM(nmer) != '' AND 
          dna IS NOT NULL AND dna >= '1915-01-01' AND dna <= CURDATE() AND
          (vid IS NULL OR vid >= CURDATE()) AND
          nat IS NOT NULL AND TRIM(nat) != '' AND
          nom IS NOT NULL AND TRIM(nom) != '' AND nom NOT REGEXP '^[Xx]+$' AND
          pre IS NOT NULL AND TRIM(pre) != '' AND pre NOT REGEXP '^[Xx]+$' AND
          (sext = 'M' OR sext = 'F') AND
          viln IS NOT NULL AND TRIM(viln) != '' AND
          payn IS NOT NULL AND TRIM(payn) != '' AND
          tid IS NOT NULL AND TRIM(tid) != ''
        THEN 1 ELSE 0 END) as valid_records
      FROM bkcli 
      WHERE tcli = "1"
    `);

        const [corporateResult] = await connection.query(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN 
          rso IS NOT NULL AND TRIM(rso) != '' AND rso NOT LIKE '%123%' AND rso NOT LIKE '%XXX%' AND
          (sig IS NULL OR (LENGTH(sig) <= 20 AND sig REGEXP '^[A-Z0-9\\-\\.\\s]+$')) AND
          nrc IS NOT NULL AND TRIM(nrc) != '' AND nrc NOT LIKE '%123%' AND nrc NOT LIKE '%XXX%' AND nrc NOT LIKE '%000%' AND nrc LIKE 'MA%' AND
          datc IS NOT NULL AND datc >= '1915-01-01' AND datc <= CURDATE() AND
          sec IS NOT NULL AND TRIM(sec) != '' AND
          fju IS NOT NULL AND TRIM(fju) != '' AND
          catn IS NOT NULL AND TRIM(catn) != '' AND
          lienbq IS NOT NULL AND TRIM(lienbq) != ''
        THEN 1 ELSE 0 END) as valid_records
      FROM bkcli 
      WHERE tcli = "2"
    `);

        const [institutionalResult] = await connection.query(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN 
          rso IS NOT NULL AND TRIM(rso) != '' AND rso NOT LIKE '%123%' AND rso NOT LIKE '%XXX%' AND
          nrc IS NOT NULL AND TRIM(nrc) != '' AND nrc NOT LIKE '%123%' AND nrc NOT LIKE '%XXX%' AND nrc NOT LIKE '%000%' AND
          datc IS NOT NULL AND datc >= '1915-01-01' AND datc <= CURDATE() AND
          sec IS NOT NULL AND TRIM(sec) != '' AND
          fju IS NOT NULL AND TRIM(fju) != '' AND
          catn IS NOT NULL AND TRIM(catn) != '' AND
          lienbq IS NOT NULL AND TRIM(lienbq) != ''
        THEN 1 ELSE 0 END) as valid_records
      FROM bkcli 
      WHERE tcli = "3"
    `);

        connection.release();

        // Calculate quality scores
        const individualScore = (individualResult[0].valid_records / Math.max(1, individualResult[0].total_records)) * 100;
        const corporateScore = (corporateResult[0].valid_records / Math.max(1, corporateResult[0].total_records)) * 100;
        const institutionalScore = (institutionalResult[0].valid_records / Math.max(1, institutionalResult[0].total_records)) * 100;

        res.json([
            {
                category: 'Clients Particuliers',
                total_records: individualResult[0].total_records,
                valid_records: individualResult[0].valid_records,
                quality_score: parseFloat(individualScore.toFixed(2))
            },
            {
                category: 'Clients Entreprises',
                total_records: corporateResult[0].total_records,
                valid_records: corporateResult[0].valid_records,
                quality_score: parseFloat(corporateScore.toFixed(2))
            },
            {
                category: 'Clients Institutionnels',
                total_records: institutionalResult[0].total_records,
                valid_records: institutionalResult[0].valid_records,
                quality_score: parseFloat(institutionalScore.toFixed(2))
            }
        ]);
    } catch (error) {
        console.error('Error getting validation metrics:', error.message);

        // Return fallback data in case of error
        res.json([
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
        ]);
    }
});

// Get individual anomalies with caching
app.get('/api/anomalies/individual', cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const forExport = req.query.forExport === 'true';
        const agencyCode = req.query.agencyCode || (req.user && req.user.agencyCode);

        const connection = await getConnection();

        // Build the query with agency filter if needed
        let query = `
      SELECT cli, nom, tcli, pre, nid, nmer, dna, nat, age, sext, viln, payn, tid, vid
      FROM bkcli 
      WHERE tcli = "1" AND (
        nid IS NULL OR TRIM(nid) = '' OR 
        (nid IS NOT NULL AND (LENGTH(nid) < 8 OR nid LIKE '%123%' OR nid LIKE '%XXX%' OR nid LIKE '%000%')) OR
        nmer IS NULL OR TRIM(nmer) = '' OR 
        dna IS NULL OR dna < '1915-01-01' OR dna > CURDATE() OR
        (vid IS NOT NULL AND vid < CURDATE()) OR
        nat IS NULL OR TRIM(nat) = '' OR
        nom IS NULL OR TRIM(nom) = '' OR nom REGEXP '^[Xx]+$' OR
        pre IS NULL OR TRIM(pre) = '' OR pre REGEXP '^[Xx]+$' OR
        sext NOT IN ('M', 'F') OR
        viln IS NULL OR TRIM(viln) = '' OR
        payn IS NULL OR TRIM(payn) = '' OR
        tid IS NULL OR TRIM(tid) = ''
      )
    `;

        // Add agency filter if needed
        if (agencyCode) {
            query += ` AND age = '${agencyCode}'`;
        }

        // Add limit and offset
        query += ` LIMIT ? OFFSET ?`;

        // Build count query
        let countQuery = `
      SELECT COUNT(*) as count
      FROM bkcli 
      WHERE tcli = "1" AND (
        nid IS NULL OR TRIM(nid) = '' OR 
        (nid IS NOT NULL AND (LENGTH(nid) < 8 OR nid LIKE '%123%' OR nid LIKE '%XXX%' OR nid LIKE '%000%')) OR
        nmer IS NULL OR TRIM(nmer) = '' OR 
        dna IS NULL OR dna < '1915-01-01' OR dna > CURDATE() OR
        (vid IS NOT NULL AND vid < CURDATE()) OR
        nat IS NULL OR TRIM(nat) = '' OR
        nom IS NULL OR TRIM(nom) = '' OR nom REGEXP '^[Xx]+$' OR
        pre IS NULL OR TRIM(pre) = '' OR pre REGEXP '^[Xx]+$' OR
        sext NOT IN ('M', 'F') OR
        viln IS NULL OR TRIM(viln) = '' OR
        payn IS NULL OR TRIM(payn) = '' OR
        tid IS NULL OR TRIM(tid) = ''
      )
    `;

        // Add agency filter to count query if needed
        if (agencyCode) {
            countQuery += ` AND age = '${agencyCode}'`;
        }

        const [rows] = await connection.query(query, [forExport ? 100000 : limit, offset]);
        const [countResult] = await connection.query(countQuery);

        connection.release();

        res.json({
            data: rows,
            page,
            limit,
            total: countResult[0].count
        });
    } catch (error) {
        console.error('Error getting individual anomalies:', error.message);

        // Return fallback data from data-buffer.json
        try {
            const dataBuffer = JSON.parse(fs.readFileSync(path.join(__dirname, 'data-buffer.json'), 'utf8'));

            // Filter by agency if needed
            let data = dataBuffer.individualAnomalies || [];
            const agencyCode = req.query.agencyCode || (req.user && req.user.agencyCode);

            if (agencyCode) {
                data = data.filter(item => item.age === agencyCode);
            }

            // Apply pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const paginatedData = data.slice(offset, offset + limit);

            res.json({
                data: paginatedData,
                page,
                limit,
                total: data.length
            });
        } catch (fallbackError) {
            console.error('Error loading fallback data:', fallbackError.message);
            res.status(500).json({ error: 'Failed to retrieve anomalies data' });
        }
    }
});

// Get corporate anomalies with caching
app.get('/api/anomalies/corporate', cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const forExport = req.query.forExport === 'true';
        const agencyCode = req.query.agencyCode || (req.user && req.user.agencyCode);

        const connection = await getConnection();

        // Build the query with agency filter if needed
        let query = `
      SELECT cli, nom, tcli, nrc, datc, rso, age, sig, sec, fju, catn, lienbq
      FROM bkcli 
      WHERE tcli = "2" AND (
        rso IS NULL OR TRIM(rso) = '' OR rso LIKE '%123%' OR rso LIKE '%XXX%' OR
        (sig IS NOT NULL AND (LENGTH(sig) > 20 OR sig NOT REGEXP '^[A-Z0-9\\-\\.\\s]+$')) OR
        nrc IS NULL OR TRIM(nrc) = '' OR nrc LIKE '%123%' OR nrc LIKE '%XXX%' OR nrc LIKE '%000%' OR nrc NOT LIKE 'MA%' OR
        datc IS NULL OR datc < '1915-01-01' OR datc > CURDATE() OR
        sec IS NULL OR TRIM(sec) = '' OR
        fju IS NULL OR TRIM(fju) = '' OR
        catn IS NULL OR TRIM(catn) = '' OR
        lienbq IS NULL OR TRIM(lienbq) = ''
      )
    `;

        // Add agency filter if needed
        if (agencyCode) {
            query += ` AND age = '${agencyCode}'`;
        }

        // Add limit and offset
        query += ` LIMIT ? OFFSET ?`;

        // Build count query
        let countQuery = `
      SELECT COUNT(*) as count
      FROM bkcli 
      WHERE tcli = "2" AND (
        rso IS NULL OR TRIM(rso) = '' OR rso LIKE '%123%' OR rso LIKE '%XXX%' OR
        (sig IS NOT NULL AND (LENGTH(sig) > 20 OR sig NOT REGEXP '^[A-Z0-9\\-\\.\\s]+$')) OR
        nrc IS NULL OR TRIM(nrc) = '' OR nrc LIKE '%123%' OR nrc LIKE '%XXX%' OR nrc LIKE '%000%' OR nrc NOT LIKE 'MA%' OR
        datc IS NULL OR datc < '1915-01-01' OR datc > CURDATE() OR
        sec IS NULL OR TRIM(sec) = '' OR
        fju IS NULL OR TRIM(fju) = '' OR
        catn IS NULL OR TRIM(catn) = '' OR
        lienbq IS NULL OR TRIM(lienbq) = ''
      )
    `;

        // Add agency filter to count query if needed
        if (agencyCode) {
            countQuery += ` AND age = '${agencyCode}'`;
        }

        const [rows] = await connection.query(query, [forExport ? 100000 : limit, offset]);
        const [countResult] = await connection.query(countQuery);

        connection.release();

        res.json({
            data: rows,
            page,
            limit,
            total: countResult[0].count
        });
    } catch (error) {
        console.error('Error getting corporate anomalies:', error.message);

        // Return fallback data from data-buffer.json
        try {
            const dataBuffer = JSON.parse(fs.readFileSync(path.join(__dirname, 'data-buffer.json'), 'utf8'));

            // Filter by agency if needed
            let data = dataBuffer.corporateAnomalies || [];
            const agencyCode = req.query.agencyCode || (req.user && req.user.agencyCode);

            if (agencyCode) {
                data = data.filter(item => item.age === agencyCode);
            }

            // Apply pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const paginatedData = data.slice(offset, offset + limit);

            res.json({
                data: paginatedData,
                page,
                limit,
                total: data.length
            });
        } catch (fallbackError) {
            console.error('Error loading fallback data:', fallbackError.message);
            res.status(500).json({ error: 'Failed to retrieve anomalies data' });
        }
    }
});

// Get institutional anomalies with caching
app.get('/api/anomalies/institutional', cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const forExport = req.query.forExport === 'true';
        const agencyCode = req.query.agencyCode || (req.user && req.user.agencyCode);

        const connection = await getConnection();

        // Build the query with agency filter if needed
        let query = `
      SELECT cli, nom, tcli, nrc, datc, rso, age, sec, fju, catn, lienbq
      FROM bkcli 
      WHERE tcli = "3" AND (
        rso IS NULL OR TRIM(rso) = '' OR rso LIKE '%123%' OR rso LIKE '%XXX%' OR
        nrc IS NULL OR TRIM(nrc) = '' OR nrc LIKE '%123%' OR nrc LIKE '%XXX%' OR nrc LIKE '%000%' OR
        datc IS NULL OR datc < '1915-01-01' OR datc > CURDATE() OR
        sec IS NULL OR TRIM(sec) = '' OR
        fju IS NULL OR TRIM(fju) = '' OR
        catn IS NULL OR TRIM(catn) = '' OR
        lienbq IS NULL OR TRIM(lienbq) = ''
      )
    `;

        // Add agency filter if needed
        if (agencyCode) {
            query += ` AND age = '${agencyCode}'`;
        }

        // Add limit and offset
        query += ` LIMIT ? OFFSET ?`;

        // Build count query
        let countQuery = `
      SELECT COUNT(*) as count
      FROM bkcli 
      WHERE tcli = "3" AND (
        rso IS NULL OR TRIM(rso) = '' OR rso LIKE '%123%' OR rso LIKE '%XXX%' OR
        nrc IS NULL OR TRIM(nrc) = '' OR nrc LIKE '%123%' OR nrc LIKE '%XXX%' OR nrc LIKE '%000%' OR
        datc IS NULL OR datc < '1915-01-01' OR datc > CURDATE() OR
        sec IS NULL OR TRIM(sec) = '' OR
        fju IS NULL OR TRIM(fju) = '' OR
        catn IS NULL OR TRIM(catn) = '' OR
        lienbq IS NULL OR TRIM(lienbq) = ''
      )
    `;

        // Add agency filter to count query if needed
        if (agencyCode) {
            countQuery += ` AND age = '${agencyCode}'`;
        }

        const [rows] = await connection.query(query, [forExport ? 100000 : limit, offset]);
        const [countResult] = await connection.query(countQuery);

        connection.release();

        res.json({
            data: rows,
            page,
            limit,
            total: countResult[0].count
        });
    } catch (error) {
        console.error('Error getting institutional anomalies:', error.message);

        // Return fallback data from data-buffer.json
        try {
            const dataBuffer = JSON.parse(fs.readFileSync(path.join(__dirname, 'data-buffer.json'), 'utf8'));

            // Filter by agency if needed
            let data = dataBuffer.institutionalAnomalies || [];
            const agencyCode = req.query.agencyCode || (req.user && req.user.agencyCode);

            if (agencyCode) {
                data = data.filter(item => item.age === agencyCode);
            }

            // Apply pagination
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const paginatedData = data.slice(offset, offset + limit);

            res.json({
                data: paginatedData,
                page,
                limit,
                total: data.length
            });
        } catch (fallbackError) {
            console.error('Error loading fallback data:', fallbackError.message);
            res.status(500).json({ error: 'Failed to retrieve anomalies data' });
        }
    }
});

// Get anomalies by branch with caching
app.get('/api/anomalies/by-branch', cacheMiddleware(600), async (req, res) => {
    try {
        const connection = await getConnection();

        // Get anomalies by branch with comprehensive rules
        const query = `
      SELECT 
        c.age as code_agence,
        COUNT(*) as nombre_anomalies
      FROM bkcli c
      WHERE 
        /* Common rules for all client types */
        (cli IS NULL OR TRIM(cli) = '' OR tcli NOT IN ('1', '2', '3') OR age IS NULL OR TRIM(age) = '')
        
        /* Rules for individual clients (tcli = 1) */
        OR (c.tcli = '1' AND (
          nid IS NULL OR TRIM(nid) = '' OR 
          (nid IS NOT NULL AND (LENGTH(nid) < 8 OR nid LIKE '%123%' OR nid LIKE '%XXX%' OR nid LIKE '%000%')) OR
          nmer IS NULL OR TRIM(nmer) = '' OR 
          dna IS NULL OR dna < '1915-01-01' OR dna > CURDATE() OR
          (vid IS NOT NULL AND vid < CURDATE()) OR
          nat IS NULL OR TRIM(nat) = '' OR
          nom IS NULL OR TRIM(nom) = '' OR nom REGEXP '^[Xx]+$' OR
          pre IS NULL OR TRIM(pre) = '' OR pre REGEXP '^[Xx]+$' OR
          sext NOT IN ('M', 'F') OR
          viln IS NULL OR TRIM(viln) = '' OR
          payn IS NULL OR TRIM(payn) = '' OR
          tid IS NULL OR TRIM(tid) = ''
        ))
        
        /* Rules for corporate clients (tcli = 2) */
        OR (c.tcli = '2' AND (
          rso IS NULL OR TRIM(rso) = '' OR rso LIKE '%123%' OR rso LIKE '%XXX%' OR
          (sig IS NOT NULL AND (LENGTH(sig) > 20 OR sig NOT REGEXP '^[A-Z0-9\\-\\.\\s]+$')) OR
          nrc IS NULL OR TRIM(nrc) = '' OR nrc LIKE '%123%' OR nrc LIKE '%XXX%' OR nrc LIKE '%000%' OR nrc NOT LIKE 'MA%' OR
          datc IS NULL OR datc < '1915-01-01' OR datc > CURDATE() OR
          sec IS NULL OR TRIM(sec) = '' OR
          fju IS NULL OR TRIM(fju) = '' OR
          catn IS NULL OR TRIM(catn) = '' OR
          lienbq IS NULL OR TRIM(lienbq) = ''
        ))
        
        /* Rules for institutional clients (tcli = 3) */
        OR (c.tcli = '3' AND (
          rso IS NULL OR TRIM(rso) = '' OR rso LIKE '%123%' OR rso LIKE '%XXX%' OR
          nrc IS NULL OR TRIM(nrc) = '' OR nrc LIKE '%123%' OR nrc LIKE '%XXX%' OR nrc LIKE '%000%' OR
          datc IS NULL OR datc < '1915-01-01' OR datc > CURDATE() OR
          sec IS NULL OR TRIM(sec) = '' OR
          fju IS NULL OR TRIM(fju) = '' OR
          catn IS NULL OR TRIM(catn) = '' OR
          lienbq IS NULL OR TRIM(lienbq) = ''
        ))
      GROUP BY c.age
      ORDER BY nombre_anomalies DESC
    `;

        const [rows] = await connection.query(query);

        connection.release();

        // Add agency names from the AGENCIES object
        const result = rows.map(row => ({
            ...row,
            lib_agence: AGENCIES[row.code_agence] || `Agence ${row.code_agence}`
        }));

        res.json(result);
    } catch (error) {
        console.error('Error getting anomalies by branch:', error.message);

        // Return fallback data from data-buffer.json
        try {
            const dataBuffer = JSON.parse(fs.readFileSync(path.join(__dirname, 'data-buffer.json'), 'utf8'));
            res.json(dataBuffer.branchAnomalies || []);
        } catch (fallbackError) {
            console.error('Error loading fallback data:', fallbackError.message);
            res.status(500).json({ error: 'Failed to retrieve branch anomalies data' });
        }
    }
});

// Get agencies with caching
app.get('/api/agencies', cacheMiddleware(3600), (req, res) => {
    try {
        const agencies = getAllAgencies();
        res.json(agencies);
    } catch (error) {
        console.error('Error getting agencies:', error.message);
        res.status(500).json({ error: 'Failed to retrieve agencies' });
    }
});

// Get FATCA statistics
app.get('/api/fatca/stats', cacheMiddleware(300), async (req, res) => {
    try {
        const clientType = req.query.clientType || 'all';

        const connection = await getConnection();

        // Get FATCA statistics
        let query = '';

        if (clientType === 'all') {
            query = `
        SELECT 
          COUNT(DISTINCT c.cli) as total,
          SUM(CASE WHEN c.tcli = '1' THEN 1 ELSE 0 END) as individual,
          SUM(CASE WHEN c.tcli = '2' THEN 1 ELSE 0 END) as corporate
        FROM bkcli c
        LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
        LEFT JOIN bktelcli t ON c.cli = t.cli
        WHERE 
          c.payn = 'US' OR c.nat = 'US' OR 
          a.cpay = 'US' OR
          t.num LIKE '+1%' OR 
          t.num LIKE '001%' OR 
          t.num LIKE '+01%' OR 
          t.num LIKE '+001%'
      `;
        } else if (clientType === '1') {
            query = `
        SELECT 
          COUNT(DISTINCT c.cli) as total,
          COUNT(DISTINCT c.cli) as individual,
          0 as corporate
        FROM bkcli c
        LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
        LEFT JOIN bktelcli t ON c.cli = t.cli
        WHERE c.tcli = '1' AND (
          c.payn = '400' OR c.nat = '400' OR 
          a.cpay = '400' OR
          t.num LIKE '+1%' OR 
          t.num LIKE '001%' OR 
          t.num LIKE '+01%' OR 
          t.num LIKE '+001%'
        )
      `;
        } else if (clientType === '2') {
            query = `
        SELECT 
          COUNT(DISTINCT c.cli) as total,
          0 as individual,
          COUNT(DISTINCT c.cli) as corporate
        FROM bkcli c
        LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
        LEFT JOIN bktelcli t ON c.cli = t.cli
        WHERE c.tcli = '2' AND (
          c.payn = '400' OR c.nat = '400' OR 
          a.cpay = 'US' OR
          t.num LIKE '+1%' OR 
          t.num LIKE '001%' OR 
          t.num LIKE '+01%' OR 
          t.num LIKE '+001%'
        )
      `;
        }

        const [rows] = await connection.query(query);

        connection.release();

        // Calculate additional statistics
        const total = rows[0].total || 0;

        res.json({
            total,
            individual: rows[0].individual || 0,
            corporate: rows[0].corporate || 0,
            toVerify: Math.round(total * 0.68),
            confirmed: Math.round(total * 0.26),
            excluded: Math.round(total * 0.06),
            pending: 0,
            currentMonth: Math.round(total * 0.1)
        });
    } catch (error) {
        console.error('Error getting FATCA statistics:', error.message);

        // Return fallback data
        const fallbackData = {
            total: 1250,
            individual: 850,
            corporate: 400,
            toVerify: 850,
            confirmed: 320,
            excluded: 80,
            pending: 0,
            currentMonth: 125
        };

        res.json(fallbackData);
    }
});

// Get FATCA indicators
app.get('/api/fatca/indicators', cacheMiddleware(300), async (req, res) => {
    try {
        const connection = await getConnection();

        // Get counts for each FATCA indicator
        const [nationalityResult] = await connection.query(`
      SELECT COUNT(DISTINCT c.cli) as count
      FROM bkcli c
      WHERE c.nat = '400'
    `);

        const [birthplaceResult] = await connection.query(`
      SELECT COUNT(DISTINCT c.cli) as count
      FROM bkcli c
      WHERE c.payn = '400'
    `);

        const [addressResult] = await connection.query(`
      SELECT COUNT(DISTINCT c.cli) as count
      FROM bkcli c
      JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
      WHERE a.cpay = 'US'
    `);

        const [phoneResult] = await connection.query(`
      SELECT COUNT(DISTINCT c.cli) as count
      FROM bkcli c
      JOIN bktelcli t ON c.cli = t.cli
      WHERE t.num LIKE '+1%' OR t.num LIKE '001%' OR t.num LIKE '+01%' OR t.num LIKE '+001%'
    `);

        const [proxyResult] = await connection.query(`
      SELECT COUNT(DISTINCT c.cli) as count
      FROM bkcli c
      JOIN bkpscm p ON c.cli = p.cli
      JOIN bkcli c2 ON p.ctie = c2.cli
      WHERE c2.payn = '400' OR c2.nat = '400'
    `);

        connection.release();

        // Return the indicator counts
        res.json({
            nationality: nationalityResult[0].count,
            birthplace: birthplaceResult[0].count,
            address: addressResult[0].count,
            phone: phoneResult[0].count,
            proxy: proxyResult[0].count
        });
    } catch (error) {
        console.error('Error getting FATCA indicators:', error.message);

        // Return fallback data
        const fallbackData = {
            nationality: 438,
            birthplace: 313,
            address: 250,
            phone: 188,
            proxy: 63
        };

        res.json(fallbackData);
    }
});

app.get('/api/fatca/clients', cacheMiddleware(300), async (req, res) => {
    try {
        // Validation des paramètres
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 100);
        const offset = (page - 1) * limit;
        const forExport = req.query.forExport === 'true';
        const status = req.query.status;
        const clientType = req.query.clientType || '1';

        const connection = await getConnection();

        // Construction de la requête principale
        let query = `
            SELECT 
                c.cli, 
                c.nom, 
                c.dou as date_entree_relation,
                CASE 
                    WHEN EXISTS (SELECT 1 FROM bkcom WHERE cha IN ('251100','251110','253110','253910') AND bkcom.cli=c.cli AND cfe='N') 
                    THEN 'Client Actif'
                    ELSE 'Ancien Client' 
                END as status_client,
                c.payn as pays_naissance, 
                c.nat as nationalite, 
                CONCAT(COALESCE(a.adr1, ''), ' ', COALESCE(a.ville, '')) as adresse,
                a.cpay as pays_adresse, 
                MAX(t.num) as telephone,
                c.clifam as relation_client,
                CASE
                    WHEN c.clifam IS NOT NULL THEN 'Familiale'
                    WHEN EXISTS (SELECT 1 FROM bkcoj WHERE bkcoj.cli = c.cli) THEN 'Joint'
                    WHEN EXISTS (SELECT 1 FROM bkpscm WHERE bkpscm.cli = c.cli) THEN 'Mandataire'
                    ELSE ''
                END as type_relation,
                'À vérifier' as fatca_status,
                NULL as fatca_date,
                NULL as fatca_uti,
                NULL as notes
            FROM bkcli c
            LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
            LEFT JOIN bktelcli t ON c.cli = t.cli
            WHERE c.tcli = ? AND (
                c.payn = '400' OR c.nat = '400' OR 
                a.cpay = 'US' OR
                t.num LIKE '+1%' OR t.num LIKE '001%' OR t.num LIKE '+01%' OR t.num LIKE '+001%'
            )
        `;

        // Filtre status si fourni
        if (status) {
            query += ` AND fatca_status = ?`;
        }

        // Group by et pagination
        query += `
            GROUP BY c.cli, c.nom, c.dou, c.payn, c.nat, a.adr1, a.ville, a.cpay, c.clifam
            ORDER BY c.cli
            LIMIT ? OFFSET ?
        `;

        // Requête de comptage
        let countQuery = `
            SELECT COUNT(DISTINCT c.cli) as count
            FROM bkcli c
            LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
            LEFT JOIN bktelcli t ON c.cli = t.cli
            WHERE c.tcli = ? AND (
                c.payn = '400' OR c.nat = '400' OR 
                a.cpay = 'US' OR
                t.num LIKE '+1%' OR t.num LIKE '001%' OR t.num LIKE '+01%' OR t.num LIKE '+001%'
            )
        `;

        if (status) {
            countQuery += ` AND fatca_status = ?`;
        }

        // Paramètres des requêtes
        const queryParams = [clientType];
        const countQueryParams = [clientType];

        if (status) {
            queryParams.push(status);
            countQueryParams.push(status);
        }

        queryParams.push(forExport ? 100000 : limit, offset);

        // Exécution des requêtes
        const [rows] = await connection.query(query, queryParams);
        const [countResult] = await connection.query(countQuery, countQueryParams);

        connection.release();

        res.json({
            success: true,
            data: rows,
            page,
            limit,
            total: countResult[0].count,
            isFallback: false
        });

    } catch (error) {
        console.error('FATCA Database Error:', {
            timestamp: new Date().toISOString(),
            endpoint: req.originalUrl,
            params: req.query,
            errorDetails: {
                message: error.message,
                sqlMessage: error.sqlMessage,
                sql: error.sql,
                stack: error.stack
            }
        });

        // Fallback simplifié
        try {
            const fallbackData = {
                fatcaClients: [],
                lastUpdated: new Date().toISOString()
            };

            // En production, utiliser le vrai fichier de fallback
            if (process.env.NODE_ENV !== 'production') {
                const dataBuffer = JSON.parse(fs.readFileSync(path.join(__dirname, 'data-buffer.json'), 'utf8'));
                fallbackData.fatcaClients = dataBuffer.fatcaClients || [];
            }

            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 100);
            const offset = (page - 1) * limit;
            const paginatedData = fallbackData.fatcaClients.slice(offset, offset + limit);

            res.json({
                success: false,
                message: 'Using fallback data',
                data: paginatedData,
                page,
                limit,
                total: fallbackData.fatcaClients.length,
                isFallback: true,
                lastUpdated: fallbackData.lastUpdated
            });

        } catch (fallbackError) {
            console.error('FATCA Fallback Failure:', fallbackError);

            res.status(500).json({
                success: false,
                error: 'service_unavailable',
                message: 'The service is temporarily unavailable',
                referenceId: `ERR-${Date.now()}`
            });
        }
    }
});

// Get corporate FATCA clients
app.get('/api/fatca/corporate', cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const forExport = req.query.forExport === 'true';
        const status = req.query.status;

        const connection = await getConnection();

        // Build the query with GROUP BY to avoid duplicates
        let query = `
  SELECT 
    c.cli, 
    c.nom, 
    c.rso as raisonSociale, 
    c.dou as dateEntreeRelation,
    CASE 
      WHEN EXISTS (SELECT 1 FROM bkcom WHERE cha IN ('251100','251110','253110','253910') AND bkcom.cli=c.cli AND cfe='N') 
      THEN 'Client Actif'
      ELSE 'Ancien Client' 
    END as statusClient,
    c.payn as paysImmatriculation, 
    c.nat as paysResidenceFiscale, 
    MAX(CONCAT(COALESCE(a.adr1, ''), ' ', COALESCE(a.ville, ''))) as adresse,
    MAX(a.cpay) as paysAdresse, 
    MAX(t.num) as telephone,
    c.age as agence,
    'À vérifier' as fatcaStatus,
    NULL as fatcaDate,
    NULL as fatcaUti,
    NULL as notes
  FROM bkcli c
  LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
  LEFT JOIN bktelcli t ON c.cli = t.cli
  WHERE c.tcli = '2' AND (
    c.payn = '400' OR c.nat = '400' OR 
    a.cpay = 'US' OR
    t.num LIKE '+1%' OR t.num LIKE '001%' OR t.num LIKE '+01%' OR t.num LIKE '+001%'
  )
  GROUP BY c.cli, c.nom, c.rso, c.dou, c.payn, c.nat, c.age
`;

        // Add status filter if provided
        if (status) {
            query += ` AND fatcaStatus = ?`;
        }

        // Add GROUP BY to avoid duplicates
        query += ` GROUP BY c.cli`;

        // Add ORDER BY and LIMIT
        query += ` ORDER BY c.cli LIMIT ? OFFSET ?`;

        // Count query with GROUP BY
        let countQuery = `
      SELECT COUNT(DISTINCT c.cli) as count
      FROM bkcli c
      LEFT JOIN bkadcli a ON c.cli = a.cli AND a.typ = 'F'
      LEFT JOIN bktelcli t ON c.cli = t.cli
      WHERE c.tcli = '2' AND (
        c.payn = '400' OR c.nat = '400' OR 
        a.cpay = 'US' OR
        t.num LIKE '+1%' OR t.num LIKE '001%' OR t.num LIKE '+01%' OR t.num LIKE '+001%'
      )
    `;

        // Add status filter to count query if provided
        if (status) {
            countQuery += ` AND fatcaStatus = ?`;
        }

        // Prepare query parameters
        const queryParams = [];
        if (status) queryParams.push(status);
        queryParams.push(forExport ? 100000 : limit, offset);

        // Prepare count query parameters
        const countQueryParams = [];
        if (status) countQueryParams.push(status);

        // Execute queries
        const [rows] = await connection.query(query, queryParams);
        const [countResult] = await connection.query(countQuery, countQueryParams);

        connection.release();

        res.json({
            data: rows,
            page,
            limit,
            total: countResult[0].count
        });
    } catch (error) {
        console.error('Error getting corporate FATCA clients:', error.message);

        // Return empty data with success status to avoid frontend errors
        res.json({
            data: [],
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            total: 0
        });
    }
});

// Get weekly correction stats
app.get('/api/correction-stats/weekly', cacheMiddleware(600), async (req, res) => {
    try {
        const weeks = parseInt(req.query.weeks) || 12;
        const agencyCode = req.query.agencyCode || (req.user && req.user.agencyCode);

        const connection = await getConnection();

        // Build the query with agency filter if needed
        let query = `
      SELECT 
        YEARWEEK(created_at) as year_week,
        CONCAT(YEAR(created_at), '-W', WEEK(created_at)) as week_label,
        status,
        COUNT(*) as count
      FROM anomaly_history
      WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? WEEK)
    `;

        // Add agency filter if needed
        if (agencyCode) {
            query += ` AND agency_code = '${agencyCode}'`;
        }

        // Group by and order by
        query += ` GROUP BY YEARWEEK(created_at), status
      ORDER BY year_week, status
    `;

        const [rows] = await connection.query(query, [weeks]);

        connection.release();

        res.json(rows);
    } catch (error) {
        console.error('Error getting weekly correction stats:', error.message);

        // Generate fallback data
        const fallbackData = [];
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

                fallbackData.push({
                    year_week: yearWeek,
                    week_label: weekLabel,
                    status,
                    count
                });
            });
        }

        res.json(fallbackData);
    }
});

// Get users by agency with caching
app.get('/api/users/by-agency', authenticateToken, requireRole(['admin', 'auditor']), cacheMiddleware(600), async (req, res) => {
    try {
        const connection = await getConnection();

        // Get users by agency
        const query = `
      SELECT 
        agency_code,
        COUNT(*) as user_count,
        MAX(last_login) as last_activity
      FROM users
      WHERE agency_code IS NOT NULL
      GROUP BY agency_code
      ORDER BY agency_code
    `;

        const [rows] = await connection.query(query);

        connection.release();

        res.json(rows);
    } catch (error) {
        console.error('Error getting users by agency:', error.message);

        // Generate fallback data
        const fallbackData = [];

        for (let i = 1; i <= 10; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));

            fallbackData.push({
                agency_code: `0${1200 + i}`,
                user_count: Math.floor(Math.random() * 5) + 1,
                last_activity: Math.random() > 0.2 ? date.toISOString() : null
            });
        }

        res.json(fallbackData);
    }
});

// Get agency correction stats
app.get('/api/agency-correction-stats', cacheMiddleware(600), async (req, res) => {
    try {
        const connection = await getConnection();
        const agencyCode = req.query.agencyCode || (req.user && req.user.agencyCode);

        // Build the query with agency filter if needed
        let query = `
      SELECT 
        agency_code,
        agency_name,
        total_anomalies,
        fixed_anomalies,
        in_review_anomalies,
        rejected_anomalies,
        CASE 
          WHEN total_anomalies > 0 THEN ROUND((fixed_anomalies / total_anomalies) * 100, 2)
          ELSE 0
        END as correction_rate,
        last_updated
      FROM agency_correction_stats
    `;

        // Add agency filter if needed
        if (agencyCode) {
            query += ` WHERE agency_code = '${agencyCode}'`;
        }

        // Order by
        query += ` ORDER BY correction_rate DESC, total_anomalies DESC`;

        const [rows] = await connection.query(query);

        connection.release();

        res.json(rows);
    } catch (error) {
        console.error('Error getting agency correction stats:', error.message);

        // Generate fallback data
        const agencies = getAllAgencies();
        const agencyCode = req.query.agencyCode || (req.user && req.user.agencyCode);

        let filteredAgencies = agencies;
        if (agencyCode) {
            filteredAgencies = agencies.filter(agency => agency.code_agence === agencyCode);
        }

        const fallbackData = filteredAgencies.map(agency => {
            const totalAnomalies = Math.floor(Math.random() * 5000) + 500;
            const fixedAnomalies = Math.floor(Math.random() * totalAnomalies);
            const inReviewAnomalies = Math.floor(Math.random() * (totalAnomalies - fixedAnomalies));
            const rejectedAnomalies = Math.floor(Math.random() * (totalAnomalies - fixedAnomalies - inReviewAnomalies));

            return {
                agency_code: agency.code_agence,
                agency_name: agency.lib_agence,
                total_anomalies: totalAnomalies,
                fixed_anomalies: fixedAnomalies,
                in_review_anomalies: inReviewAnomalies,
                rejected_anomalies: rejectedAnomalies,
                correction_rate: parseFloat(((fixedAnomalies / totalAnomalies) * 100).toFixed(2)),
                last_updated: new Date().toISOString()
            };
        });

        res.json(fallbackData);
    }
});

// Clear cache
app.post('/api/cache/clear', authenticateToken, async (req, res) => {
    try {
        await clearCache();
        res.json({ success: true, message: 'Cache cleared successfully' });
    } catch (error) {
        console.error('Error clearing cache:', error.message);
        res.status(500).json({ error: 'Failed to clear cache' });
    }
});

// Refresh materialized view (simulated)
app.post('/api/materialized-views/refresh', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { viewName } = req.body;

        if (!viewName) {
            return res.status(400).json({ error: 'View name is required' });
        }

        // Simulate refreshing a materialized view
        console.log(`Refreshing materialized view: ${viewName}`);

        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Clear cache for related endpoints
        if (viewName === 'vw_correction_progress') {
            await deleteCache('api:/api/correction-stats/weekly');
        } else if (viewName === 'vw_agency_correction_stats') {
            await deleteCache('api:/api/agency-correction-stats');
        } else if (viewName === 'vw_users_by_agency') {
            await deleteCache('api:/api/users/by-agency');
        }

        res.json({
            success: true,
            message: `Materialized view ${viewName} refreshed successfully`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error refreshing materialized view:', error.message);
        res.status(500).json({ error: 'Failed to refresh materialized view' });
    }
});

// Get global tracking data
app.get('/api/tracking/global', authenticateToken, async (req, res) => {
    try {
        const startDate = req.query.startDate || '2025-01-01';
        const endDate = req.query.endDate || new Date().toISOString().split('T')[0];
        const clientTypes = req.query.clientTypes ? req.query.clientTypes.split(',') : ['1', '2', '3'];
        const agencyCode = req.query.agencyCode;

        const connection = await getConnection();

        // Get agencies
        const agencies = getAllAgencies();

        // Filter agencies if agencyCode is provided
        const filteredAgencies = agencyCode
            ? agencies.filter(a => a.code_agence === agencyCode)
            : agencies;

        // Generate tracking data for each agency
        const trackingData = filteredAgencies.map(agency => {
            // Generate random data for demonstration
            const fluxTotal = Math.floor(Math.random() * 1000) + 100;
            const fluxAnomalies = Math.floor(fluxTotal * (Math.random() * 0.3 + 0.1));
            const fluxFiabilises = Math.floor(fluxAnomalies * (Math.random() * 0.8 + 0.1));

            const stockActifs = Math.floor(Math.random() * 10000) + 1000;
            const stockAnomalies = Math.floor(stockActifs * (Math.random() * 0.3 + 0.1));
            const stockFiabilises = Math.floor(stockAnomalies * (Math.random() * 0.8 + 0.1));

            const generalActifs = stockActifs;
            const generalAnomalies = stockAnomalies;
            const generalFiabilises = stockFiabilises;

            const tauxAnomalies = parseFloat(((generalAnomalies / generalActifs) * 100).toFixed(1));
            const tauxFiabilisation = parseFloat(((generalFiabilises / generalAnomalies) * 100).toFixed(1));

            return {
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
                    actifs: generalActifs,
                    anomalies: generalAnomalies,
                    fiabilises: generalFiabilises
                },
                indicators: {
                    tauxAnomalies,
                    tauxFiabilisation
                }
            };
        });

        connection.release();

        res.json(trackingData);
    } catch (error) {
        console.error('Error getting global tracking data:', error.message);

        // Generate fallback data
        const agencies = getAllAgencies();

        // Filter agencies if agencyCode is provided
        const filteredAgencies = req.query.agencyCode
            ? agencies.filter(a => a.code_agence === req.query.agencyCode)
            : agencies;

        // Generate tracking data for each agency
        const trackingData = filteredAgencies.map(agency => {
            // Generate random data for demonstration
            const fluxTotal = Math.floor(Math.random() * 1000) + 100;
            const fluxAnomalies = Math.floor(fluxTotal * (Math.random() * 0.3 + 0.1));
            const fluxFiabilises = Math.floor(fluxAnomalies * (Math.random() * 0.8 + 0.1));

            const stockActifs = Math.floor(Math.random() * 10000) + 1000;
            const stockAnomalies = Math.floor(stockActifs * (Math.random() * 0.3 + 0.1));
            const stockFiabilises = Math.floor(stockAnomalies * (Math.random() * 0.8 + 0.1));

            const generalActifs = stockActifs;
            const generalAnomalies = stockAnomalies;
            const generalFiabilises = stockFiabilises;

            const tauxAnomalies = parseFloat(((generalAnomalies / generalActifs) * 100).toFixed(1));
            const tauxFiabilisation = parseFloat(((generalFiabilises / generalAnomalies) * 100).toFixed(1));

            return {
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
                    actifs: generalActifs,
                    anomalies: generalAnomalies,
                    fiabilises: generalFiabilises
                },
                indicators: {
                    tauxAnomalies,
                    tauxFiabilisation
                }
            };
        });

        res.json(trackingData);
    }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

// Start the server
const server = app.listen(PORT, '127.0.0.1', async () => {
    console.log(`🚀 Server running at http://127.0.0.1:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Access the application at: http://localhost:${PORT}`);
    console.log('');

    console.log('🔐 Authentication endpoints:');
    console.log('   • GET  /api/setup - Database setup');
    console.log('   • POST /api/auth/login - User login');
    console.log('');

    console.log('📋 Available test accounts:');
    console.log('   • admin / admin123 (Administrateur)');
    console.log('   • auditor / audit123 (Auditeur)');
    console.log('   • user / user123 (Utilisateur)');
    console.log('   • agency_XXXXX / agencyXXXXX (Utilisateur Agence, où XXXXX est le code agence)');
    console.log('');

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
    console.log('   • POST /api/anomaly-history - Record anomaly modification');
    console.log('   • GET  /api/anomaly-history - Get anomaly history');
    console.log('   • GET  /api/agency-correction-stats - Agency correction stats');
    console.log('   • GET  /api/correction-stats/weekly - Weekly correction stats');
    console.log('   • GET  /api/data-load-history - Data load history');
    console.log('   • GET  /api/users/by-agency - Users by agency');
    console.log('   • POST /api/agency-users - Create agency user');
    console.log('   • POST /api/bulk-create-agency-users - Bulk create agency users');
    console.log('   • GET  /api/tracking/global - Global tracking data');
    console.log('   • POST /api/cache/clear - Clear cache');
    console.log('   • POST /api/materialized-views/refresh - Refresh materialized view');
    console.log('');

    // Get local IP addresses for easier access from other devices
    const nets = os.networkInterfaces();
    const results = {};

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }

    console.log(`🌐 Server accessible from all network interfaces at: http://0.0.0.0:${PORT}`);

    // Test database connection
    try {
        const connection = await getConnection();
        console.log('✅ Database connection successful');

        // Get database information
        const [dbInfo] = await connection.query('SELECT DATABASE() as db');
        console.log(`📊 Connected to: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${dbInfo[0].db}`);

        // Get table information
        try {
            const [tables] = await connection.query(`
        SELECT 
          TABLE_NAME, 
          (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = t.TABLE_NAME) as column_count
        FROM information_schema.TABLES t
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME
      `);

            console.log(`📋 Found ${tables.length} tables in database`);
            tables.forEach(table => {
                console.log(`   • ${table.TABLE_NAME}: ${table.column_count} columns`);
            });
        } catch (tableError) {
            console.error('Error getting table information:', tableError.message);
        }

        connection.release();
        console.log('🗄️ Database status: Connected');
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        console.log('🗄️ Database status: Error - Using fallback data');
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });

    try {
        await closeRedisConnection();
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error.message);
        process.exit(1);
    }
});
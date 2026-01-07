import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';
import {
  checkDriverExists,
  downloadDriver,
  getAllDriversStatus,
  deleteDriver
} from './jdbcDriverManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONFIG_FILE = path.join(__dirname, 'corebanking-configs.json');
const JAVA_BACKEND_URL = process.env.JAVA_BACKEND_URL || 'http://localhost:8080';

async function loadConfigs() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveConfigs(configs) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(configs, null, 2));
}

function generateId() {
  return `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function setupCoreBankingEndpoints(app, authenticateToken, requireRole) {
  app.get('/api/corebanking/configs', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const configs = await loadConfigs();
      res.json(configs);
    } catch (error) {
      console.error('Failed to load configs:', error);
      res.status(500).json({ error: 'Failed to load configurations' });
    }
  });

  app.get('/api/corebanking/configs/default', authenticateToken, async (req, res) => {
    try {
      const configs = await loadConfigs();
      const defaultConfig = configs.find(c => c.isDefault);
      res.json(defaultConfig || null);
    } catch (error) {
      console.error('Failed to load default config:', error);
      res.status(500).json({ error: 'Failed to load default configuration' });
    }
  });

  app.get('/api/corebanking/configs/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const configs = await loadConfigs();
      const config = configs.find(c => c.id === req.params.id);
      if (!config) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      res.json(config);
    } catch (error) {
      console.error('Failed to load config:', error);
      res.status(500).json({ error: 'Failed to load configuration' });
    }
  });

  app.post('/api/corebanking/configs', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const configs = await loadConfigs();

      const newConfig = {
        id: generateId(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (newConfig.isDefault) {
        configs.forEach(c => c.isDefault = false);
      }

      configs.push(newConfig);
      await saveConfigs(configs);

      res.status(201).json(newConfig);
    } catch (error) {
      console.error('Failed to create config:', error);
      res.status(500).json({ error: 'Failed to create configuration' });
    }
  });

  app.put('/api/corebanking/configs/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const configs = await loadConfigs();
      const index = configs.findIndex(c => c.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      const updatedConfig = {
        ...configs[index],
        ...req.body,
        id: req.params.id,
        updatedAt: new Date().toISOString()
      };

      if (updatedConfig.isDefault) {
        configs.forEach((c, i) => {
          if (i !== index) c.isDefault = false;
        });
      }

      configs[index] = updatedConfig;
      await saveConfigs(configs);

      res.json(updatedConfig);
    } catch (error) {
      console.error('Failed to update config:', error);
      res.status(500).json({ error: 'Failed to update configuration' });
    }
  });

  app.delete('/api/corebanking/configs/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const configs = await loadConfigs();
      const filteredConfigs = configs.filter(c => c.id !== req.params.id);

      if (filteredConfigs.length === configs.length) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      await saveConfigs(filteredConfigs);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete config:', error);
      res.status(500).json({ error: 'Failed to delete configuration' });
    }
  });

  app.post('/api/corebanking/test-connection', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const startTime = Date.now();

      try {
        const response = await axios.post(`${JAVA_BACKEND_URL}/api/corebanking/test-connection`, req.body, {
          timeout: 10000
        });

        const responseTime = Date.now() - startTime;

        if (req.body.id) {
          const configs = await loadConfigs();
          const config = configs.find(c => c.id === req.body.id);
          if (config) {
            config.lastTestedAt = new Date().toISOString();
            config.lastTestStatus = response.data.success ? 'success' : 'failed';
            await saveConfigs(configs);
          }
        }

        res.json({
          success: response.data.success,
          message: response.data.message || 'Connexion réussie',
          responseTime
        });
      } catch (error) {
        const responseTime = Date.now() - startTime;

        if (req.body.id) {
          const configs = await loadConfigs();
          const config = configs.find(c => c.id === req.body.id);
          if (config) {
            config.lastTestedAt = new Date().toISOString();
            config.lastTestStatus = 'failed';
            await saveConfigs(configs);
          }
        }

        res.json({
          success: false,
          message: 'Échec de la connexion',
          error: error.response?.data?.message || error.message,
          responseTime
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du test de connexion',
        error: error.message
      });
    }
  });

  app.post('/api/corebanking/test-connection/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const configs = await loadConfigs();
      const config = configs.find(c => c.id === req.params.id);

      if (!config) {
        return res.status(404).json({ error: 'Configuration not found' });
      }

      const startTime = Date.now();

      try {
        const response = await axios.post(`${JAVA_BACKEND_URL}/api/corebanking/test-connection`, config, {
          timeout: 10000
        });

        const responseTime = Date.now() - startTime;

        config.lastTestedAt = new Date().toISOString();
        config.lastTestStatus = response.data.success ? 'success' : 'failed';
        await saveConfigs(configs);

        res.json({
          success: response.data.success,
          message: response.data.message || 'Connexion réussie',
          responseTime
        });
      } catch (error) {
        const responseTime = Date.now() - startTime;

        config.lastTestedAt = new Date().toISOString();
        config.lastTestStatus = 'failed';
        await saveConfigs(configs);

        res.json({
          success: false,
          message: 'Échec de la connexion',
          error: error.response?.data?.message || error.message,
          responseTime
        });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du test de connexion',
        error: error.message
      });
    }
  });

  app.post('/api/corebanking/configs/:id/set-default', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const configs = await loadConfigs();

      configs.forEach(c => {
        c.isDefault = c.id === req.params.id;
      });

      await saveConfigs(configs);
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to set default config:', error);
      res.status(500).json({ error: 'Failed to set default configuration' });
    }
  });

  app.get('/api/corebanking/query', authenticateToken, async (req, res) => {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      const configs = await loadConfigs();
      const defaultConfig = configs.find(c => c.isDefault && c.isActive);

      if (!defaultConfig) {
        return res.status(404).json({ error: 'No active default configuration found' });
      }

      const response = await axios.post(`${JAVA_BACKEND_URL}/api/corebanking/query`, {
        config: defaultConfig,
        query
      }, {
        timeout: 30000
      });

      res.json(response.data);
    } catch (error) {
      console.error('Query execution error:', error);
      res.status(500).json({
        error: 'Failed to execute query',
        message: error.response?.data?.message || error.message
      });
    }
  });

  app.get('/api/corebanking/drivers', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const driversStatus = await getAllDriversStatus();
      res.json(driversStatus);
    } catch (error) {
      console.error('Failed to get drivers status:', error);
      res.status(500).json({ error: 'Failed to retrieve drivers status' });
    }
  });

  app.get('/api/corebanking/drivers/:dbType/check', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { dbType } = req.params;
      const status = await checkDriverExists(dbType);
      res.json(status);
    } catch (error) {
      console.error('Failed to check driver:', error);
      res.status(500).json({ error: 'Failed to check driver status' });
    }
  });

  app.post('/api/corebanking/drivers/:dbType/download', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { dbType } = req.params;

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const result = await downloadDriver(dbType, (percent, loaded, total) => {
        res.write(`data: ${JSON.stringify({ percent, loaded, total })}\n\n`);
      });

      res.write(`data: ${JSON.stringify({ success: true, ...result })}\n\n`);
      res.end();
    } catch (error) {
      console.error('Failed to download driver:', error);
      res.write(`data: ${JSON.stringify({ success: false, error: error.message })}\n\n`);
      res.end();
    }
  });

  app.delete('/api/corebanking/drivers/:dbType', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
      const { dbType } = req.params;
      const result = await deleteDriver(dbType);
      res.json(result);
    } catch (error) {
      console.error('Failed to delete driver:', error);
      res.status(500).json({ error: 'Failed to delete driver' });
    }
  });
}

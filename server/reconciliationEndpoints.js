import express from 'express';
import { getInformixPool, getMySQLPool } from './hybridDatabase.js';

const router = express.Router();

class ReconciliationService {
  async getTask(taskId, mysqlPool) {
    const [tasks] = await mysqlPool.execute(
      `SELECT t.id, t.ticket_id, t.client_id, t.status, t.created_at, t.attempts,
              c.client_name
       FROM reconciliation_tasks t
       LEFT JOIN corrections c ON c.ticket_id = t.ticket_id
       WHERE t.id = ?`,
      [taskId]
    );

    if (tasks.length === 0) return null;

    const task = tasks[0];

    const [corrections] = await mysqlPool.execute(
      `SELECT field_name as field, field_label, old_value, new_value as expected_value,
              cbs_value, is_matched, last_checked_at
       FROM corrections
       WHERE ticket_id = ?`,
      [task.ticket_id]
    );

    task.corrections = corrections;
    return task;
  }

  async getClientFromCBS(clientId, informixPool) {
    try {
      const connection = await informixPool.connect();

      const query = `
        SELECT FIRST 1
          client_id,
          nom,
          prenom,
          adresse,
          ville,
          code_postal,
          telephone,
          email,
          date_naissance,
          nationalite,
          type_client,
          statut_fatca
        FROM clients
        WHERE client_id = ?
      `;

      const result = await connection.query(query, [clientId]);
      await connection.close();

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error reading from CBS:', error);
      throw new Error('CBS unavailable: ' + error.message);
    }
  }

  normalizeValue(value) {
    if (!value) return '';
    return value.toString().trim().toLowerCase();
  }

  compareValues(expected, actual) {
    return this.normalizeValue(expected) === this.normalizeValue(actual);
  }

  calculateSeverity(field) {
    const criticalFields = ['client_id', 'tax_id', 'nationalite'];
    if (criticalFields.includes(field)) return 'high';

    const mediumFields = ['nom', 'prenom', 'adresse', 'telephone', 'email'];
    if (mediumFields.includes(field)) return 'medium';

    return 'low';
  }

  mapFieldToCBSColumn(field) {
    const fieldMapping = {
      'name': 'nom',
      'firstname': 'prenom',
      'address': 'adresse',
      'city': 'ville',
      'postal_code': 'code_postal',
      'phone': 'telephone',
      'email': 'email',
      'birth_date': 'date_naissance',
      'nationality': 'nationalite',
      'client_type': 'type_client',
      'fatca_status': 'statut_fatca'
    };

    return fieldMapping[field] || field;
  }

  async reconcileTask(taskId, mysqlPool, informixPool) {
    const task = await this.getTask(taskId, mysqlPool);
    if (!task) {
      throw new Error('Task not found');
    }

    const cbsData = await this.getClientFromCBS(task.client_id, informixPool);
    if (!cbsData) {
      throw new Error('Client not found in CBS');
    }

    const discrepancies = [];
    let matchedFields = 0;

    for (const correction of task.corrections) {
      const cbsColumn = this.mapFieldToCBSColumn(correction.field);
      const cbsValue = cbsData[cbsColumn];
      const isMatched = this.compareValues(correction.expected_value, cbsValue);

      if (isMatched) {
        matchedFields++;
      } else {
        discrepancies.push({
          field: correction.field,
          field_label: correction.field_label,
          expected_value: correction.expected_value,
          actual_value: cbsValue,
          severity: this.calculateSeverity(correction.field)
        });
      }

      await mysqlPool.execute(
        `UPDATE corrections
         SET cbs_value = ?, is_matched = ?, last_checked_at = NOW()
         WHERE ticket_id = ? AND field_name = ?`,
        [cbsValue, isMatched, task.ticket_id, correction.field]
      );
    }

    const totalFields = task.corrections.length;
    const status = matchedFields === totalFields ? 'reconciled'
                  : matchedFields > 0 ? 'partial'
                  : 'failed';

    await mysqlPool.execute(
      `UPDATE reconciliation_tasks
       SET status = ?, last_attempt_at = NOW(), attempts = attempts + 1,
           reconciled_at = CASE WHEN ? = 'reconciled' THEN NOW() ELSE reconciled_at END
       WHERE id = ?`,
      [status, status, taskId]
    );

    return {
      task_id: taskId,
      status: status === 'reconciled' ? 'success' : status,
      matched_fields: matchedFields,
      total_fields: totalFields,
      discrepancies,
      checked_at: new Date().toISOString()
    };
  }

  async getPendingTasks(filters, mysqlPool) {
    let query = `
      SELECT DISTINCT
        t.id, t.ticket_id, t.client_id, t.status, t.created_at,
        t.attempts, t.last_attempt_at, t.error_message,
        a.client_name, a.agency_code
      FROM reconciliation_tasks t
      LEFT JOIN anomalies a ON a.id = (
        SELECT anomaly_id FROM tickets WHERE ticket_number = t.ticket_id LIMIT 1
      )
      WHERE t.status = 'pending'
    `;

    const params = [];

    if (filters.agency_code) {
      query += ' AND a.agency_code = ?';
      params.push(filters.agency_code);
    }

    if (filters.client_id) {
      query += ' AND t.client_id = ?';
      params.push(filters.client_id);
    }

    query += ' ORDER BY t.created_at DESC LIMIT 100';

    const [tasks] = await mysqlPool.execute(query, params);

    for (const task of tasks) {
      const [corrections] = await mysqlPool.execute(
        `SELECT field_name as field, field_label, new_value as expected_value,
                cbs_value, is_matched, last_checked_at
         FROM corrections
         WHERE ticket_id = ?`,
        [task.ticket_id]
      );
      task.corrections = corrections;
    }

    return tasks;
  }

  async getReconciliationHistory(filters, mysqlPool) {
    let query = `
      SELECT DISTINCT
        t.id, t.ticket_id, t.client_id, t.status, t.created_at,
        t.reconciled_at, t.attempts, t.last_attempt_at, t.error_message,
        a.client_name, a.agency_code
      FROM reconciliation_tasks t
      LEFT JOIN anomalies a ON a.id = (
        SELECT anomaly_id FROM tickets WHERE ticket_number = t.ticket_id LIMIT 1
      )
      WHERE 1=1
    `;

    const params = [];

    if (filters.ticket_id) {
      query += ' AND t.ticket_id = ?';
      params.push(filters.ticket_id);
    }

    if (filters.client_id) {
      query += ' AND t.client_id = ?';
      params.push(filters.client_id);
    }

    if (filters.status) {
      query += ' AND t.status = ?';
      params.push(filters.status);
    }

    if (filters.start_date) {
      query += ' AND t.created_at >= ?';
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ' AND t.created_at <= ?';
      params.push(filters.end_date);
    }

    query += ' ORDER BY t.created_at DESC LIMIT 500';

    const [tasks] = await mysqlPool.execute(query, params);

    for (const task of tasks) {
      const [corrections] = await mysqlPool.execute(
        `SELECT field_name as field, field_label, new_value as expected_value,
                cbs_value, is_matched, last_checked_at
         FROM corrections
         WHERE ticket_id = ?`,
        [task.ticket_id]
      );
      task.corrections = corrections;
    }

    return tasks;
  }

  async getStats(agencyCode, mysqlPool) {
    const whereClause = agencyCode
      ? 'WHERE a.agency_code = ?'
      : 'WHERE 1=1';

    const params = agencyCode ? [agencyCode, agencyCode, agencyCode] : [];

    const [stats] = await mysqlPool.execute(
      `SELECT
        COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as total_pending,
        COUNT(CASE WHEN t.status = 'reconciled' AND DATE(t.reconciled_at) = CURDATE() THEN 1 END) as reconciled_today,
        COUNT(CASE WHEN t.status = 'failed' AND DATE(t.last_attempt_at) = CURDATE() THEN 1 END) as failed_today,
        ROUND(
          COUNT(CASE WHEN t.status = 'reconciled' THEN 1 END) * 100.0 /
          NULLIF(COUNT(*), 0), 2
        ) as success_rate,
        AVG(TIMESTAMPDIFF(SECOND, t.created_at, t.reconciled_at)) as average_reconciliation_time
      FROM reconciliation_tasks t
      LEFT JOIN anomalies a ON a.id = (
        SELECT anomaly_id FROM tickets WHERE ticket_number = t.ticket_id LIMIT 1
      )
      ${whereClause}`,
      params
    );

    const [byStatus] = await mysqlPool.execute(
      `SELECT t.status, COUNT(*) as count
       FROM reconciliation_tasks t
       LEFT JOIN anomalies a ON a.id = (
         SELECT anomaly_id FROM tickets WHERE ticket_number = t.ticket_id LIMIT 1
       )
       ${whereClause}
       GROUP BY t.status`,
      params
    );

    return {
      ...stats[0],
      by_status: byStatus
    };
  }
}

const reconciliationService = new ReconciliationService();

router.get('/pending', async (req, res) => {
  try {
    const mysqlPool = getMySQLPool();
    const filters = {
      agency_code: req.query.agency_code,
      client_id: req.query.client_id
    };

    const tasks = await reconciliationService.getPendingTasks(filters, mysqlPool);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching pending reconciliations:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const mysqlPool = getMySQLPool();
    const filters = {
      ticket_id: req.query.ticket_id,
      client_id: req.query.client_id,
      status: req.query.status,
      start_date: req.query.start_date,
      end_date: req.query.end_date
    };

    const tasks = await reconciliationService.getReconciliationHistory(filters, mysqlPool);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching reconciliation history:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const mysqlPool = getMySQLPool();
    const agencyCode = req.query.agency_code;

    const stats = await reconciliationService.getStats(agencyCode, mysqlPool);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching reconciliation stats:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const mysqlPool = getMySQLPool();
    const task = await reconciliationService.getTask(req.params.id, mysqlPool);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching reconciliation task:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/reconcile', async (req, res) => {
  try {
    const mysqlPool = getMySQLPool();
    const informixPool = getInformixPool();

    const result = await reconciliationService.reconcileTask(
      req.params.id,
      mysqlPool,
      informixPool
    );

    res.json(result);
  } catch (error) {
    console.error('Error reconciling task:', error);

    const mysqlPool = getMySQLPool();
    await mysqlPool.execute(
      `UPDATE reconciliation_tasks
       SET status = 'failed', error_message = ?, last_attempt_at = NOW(), attempts = attempts + 1
       WHERE id = ?`,
      [error.message, req.params.id]
    );

    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/retry', async (req, res) => {
  try {
    const mysqlPool = getMySQLPool();

    await mysqlPool.execute(
      `UPDATE reconciliation_tasks SET status = 'pending' WHERE id = ?`,
      [req.params.id]
    );

    const informixPool = getInformixPool();
    const result = await reconciliationService.reconcileTask(
      req.params.id,
      mysqlPool,
      informixPool
    );

    res.json(result);
  } catch (error) {
    console.error('Error retrying reconciliation:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/reconcile-all', async (req, res) => {
  try {
    const mysqlPool = getMySQLPool();
    const informixPool = getInformixPool();
    const { agency_code, max_tasks = 50 } = req.body;

    const tasks = await reconciliationService.getPendingTasks(
      { agency_code },
      mysqlPool
    );

    const tasksToProcess = tasks.slice(0, max_tasks);
    let success = 0;
    let failed = 0;

    for (const task of tasksToProcess) {
      try {
        const result = await reconciliationService.reconcileTask(
          task.id,
          mysqlPool,
          informixPool
        );

        if (result.status === 'success') {
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Error reconciling task ${task.id}:`, error);
        failed++;
      }
    }

    res.json({
      success,
      failed,
      total: tasksToProcess.length
    });
  } catch (error) {
    console.error('Error in batch reconciliation:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/:ticketId/close', async (req, res) => {
  try {
    const mysqlPool = getMySQLPool();
    const { ticket_id } = req.params;
    const { user_id, comments } = req.body;

    await mysqlPool.execute(
      `UPDATE tickets SET status = 'closed', resolved_by = ?, resolution_comments = ?, resolved_at = NOW()
       WHERE ticket_number = ?`,
      [user_id, comments, ticket_id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

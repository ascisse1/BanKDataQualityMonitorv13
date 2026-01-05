import { validationRulesService } from '../src/services/validationRules.js';

// Endpoint pour valider un enregistrement client
export const validateClientRecord = async (req, res) => {
  try {
    const { record } = req.body;
    
    if (!record || !record.cli || !record.tcli) {
      return res.status(400).json({
        error: 'Record invalide. Les champs cli et tcli sont obligatoires.'
      });
    }

    const validationResult = validationRulesService.validateRecord(record);
    
    res.json({
      success: true,
      result: validationResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: 'Erreur lors de la validation',
      message: error.message
    });
  }
};

// Endpoint pour valider en lot
export const validateBatchRecords = async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        error: 'Liste d\'enregistrements invalide'
      });
    }

    const results = records.map(record => ({
      cli: record.cli,
      validation: validationRulesService.validateRecord(record)
    }));

    const summary = {
      total: results.length,
      valid: results.filter(r => r.validation.isValid).length,
      invalid: results.filter(r => !r.validation.isValid).length,
      totalErrors: results.reduce((sum, r) => sum + r.validation.errors.length, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.validation.warnings.length, 0)
    };

    res.json({
      success: true,
      results,
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Batch validation error:', error);
    res.status(500).json({
      error: 'Erreur lors de la validation en lot',
      message: error.message
    });
  }
};

// Endpoint pour obtenir les règles de validation
export const getValidationRules = async (req, res) => {
  try {
    const { clientType } = req.query;
    
    let rules;
    if (clientType && ['1', '2', '3'].includes(clientType)) {
      rules = validationRulesService.getRulesByClientType(clientType);
    } else {
      rules = validationRulesService.getRules();
    }

    res.json({
      success: true,
      rules,
      count: rules.length
    });
  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des règles',
      message: error.message
    });
  }
};

// Endpoint pour mettre à jour une règle
export const updateValidationRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const success = validationRulesService.updateRule(ruleId, updates);
    
    if (success) {
      res.json({
        success: true,
        message: 'Règle mise à jour avec succès'
      });
    } else {
      res.status(404).json({
        error: 'Règle non trouvée'
      });
    }
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({
      error: 'Erreur lors de la mise à jour de la règle',
      message: error.message
    });
  }
};
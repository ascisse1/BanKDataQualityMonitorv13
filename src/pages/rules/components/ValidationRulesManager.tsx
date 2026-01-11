import React, { useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Save, X, AlertTriangle, AlertCircle, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { ValidationRule, RuleCondition, NaturalRuleType, RULE_TYPE_LABELS, FIELD_LABELS } from '../../../types/ValidationRules';
import { validationRulesService } from '../../../services/validationRules';
import { useToast } from '../../../components/ui/Toaster';

const ValidationRulesManager: React.FC = () => {
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [selectedClientType, setSelectedClientType] = useState<'1' | '2' | '3' | 'all'>('all');
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const loadRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let fetchedRules: ValidationRule[];
      if (selectedClientType === 'all') {
        fetchedRules = await validationRulesService.getRulesAsync();
      } else {
        fetchedRules = await validationRulesService.getRulesByClientTypeAsync(selectedClientType);
      }
      setRules(fetchedRules);
    } catch (err) {
      console.error('Failed to load validation rules:', err);
      setError('Erreur lors du chargement des règles. Vérifiez que le serveur Spring Boot est démarré sur le port 8080.');
      addToast('Erreur lors du chargement des règles', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClientType, addToast]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await validationRulesService.refreshRules();
      await loadRules();
      addToast('Règles actualisées avec succès', 'success');
    } catch (err) {
      addToast('Erreur lors de l\'actualisation des règles', 'error');
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    try {
      const success = await validationRulesService.toggleRuleOnBackend(ruleId, !rule.isActive);
      if (success) {
        setRules(prev => prev.map(r =>
          r.id === ruleId ? { ...r, isActive: !r.isActive } : r
        ));
        addToast('Règle mise à jour avec succès', 'success');
      } else {
        addToast('Erreur lors de la mise à jour de la règle', 'error');
      }
    } catch (err) {
      addToast('Erreur lors de la mise à jour de la règle', 'error');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      try {
        const success = await validationRulesService.deleteRuleOnBackend(ruleId);
        if (success) {
          setRules(prev => prev.filter(r => r.id !== ruleId));
          addToast('Règle supprimée avec succès', 'success');
        } else {
          addToast('Erreur lors de la suppression de la règle', 'error');
        }
      } catch (err) {
        addToast('Erreur lors de la suppression de la règle', 'error');
      }
    }
  };

  const handleSaveRule = async (rule: ValidationRule) => {
    try {
      if (editingRule) {
        const success = await validationRulesService.updateRuleOnBackend(rule.id, rule);
        if (success) {
          setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
          addToast('Règle mise à jour avec succès', 'success');
        } else {
          addToast('Erreur lors de la mise à jour de la règle', 'error');
        }
      } else {
        const newRule = await validationRulesService.createRule(rule);
        if (newRule) {
          setRules(prev => [...prev, newRule]);
          addToast('Règle créée avec succès', 'success');
        } else {
          addToast('Erreur lors de la création de la règle', 'error');
        }
      }
    } catch (err) {
      addToast('Erreur lors de la sauvegarde de la règle', 'error');
    }

    setEditingRule(null);
    setIsCreating(false);
  };

  const getClientTypeLabel = (type: string | null) => {
    switch (type) {
      case '1': return 'Particuliers';
      case '2': return 'Entreprises';
      case '3': return 'Institutionnels';
      case null: return 'Tous';
      default: return 'Tous';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-error-100 text-error-800';
      case 'high': return 'bg-warning-100 text-warning-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRules = rules.filter(rule =>
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestion des Règles de Validation</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configurez les règles de contrôle pour chaque type de client
          </p>
        </div>

        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <Button
            variant="outline"
            leftIcon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            Actualiser
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreating(true)}
            disabled={isLoading}
          >
            Nouvelle Règle
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
            <div className="flex-1">
              <Input
                placeholder="Rechercher une règle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex space-x-2">
              {['all', '1', '2', '3'].map((type) => (
                <Button
                  key={type}
                  variant={selectedClientType === type ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedClientType(type as any)}
                >
                  {getClientTypeLabel(type)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Liste des règles */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Règles de Validation ({filteredRules.length})
            </h3>
            <div className="text-sm text-gray-500">
              {filteredRules.filter(r => r.isActive).length} actives
            </div>
          </div>

          {!isLoading && !error && filteredRules.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Règle
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Champ
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type Client
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sévérité
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                        <div className="text-sm text-gray-500">{rule.description}</div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">{rule.field}</code>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">
                        {getClientTypeLabel(rule.clientType)}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(rule.severity)}`}>
                        {rule.severity}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className="flex items-center"
                      >
                        {rule.isActive ? (
                          <div className="flex items-center text-success-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span className="text-sm">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <X className="h-4 w-4 mr-1" />
                            <span className="text-sm">Inactive</span>
                          </div>
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Edit className="h-4 w-4" />}
                          onClick={() => setEditingRule(rule)}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Trash2 className="h-4 w-4" />}
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-error-600 hover:text-error-700"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-primary-500 mx-auto mb-2 animate-spin" />
              <p className="text-gray-500">Chargement des règles...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-error-500 mx-auto mb-2" />
              <p className="text-error-600">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleRefresh}
              >
                Réessayer
              </Button>
            </div>
          )}

          {!isLoading && !error && filteredRules.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Aucune règle trouvée</p>
              <p className="text-sm text-gray-400 mt-1">
                Les règles de validation sont chargées depuis le serveur Spring Boot
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal d'édition/création */}
      <RuleEditor
        isOpen={editingRule !== null || isCreating}
        rule={editingRule}
        onSave={handleSaveRule}
        onClose={() => {
          setEditingRule(null);
          setIsCreating(false);
        }}
      />
    </div>
  );
};

interface RuleEditorProps {
  isOpen: boolean;
  rule: ValidationRule | null;
  onSave: (rule: ValidationRule) => void;
  onClose: () => void;
}

// Available field names for selection
const AVAILABLE_FIELDS = Object.keys(FIELD_LABELS);

// Rule types grouped by category
const RULE_TYPE_CATEGORIES: Record<string, NaturalRuleType[]> = {
  'Presence': ['required', 'optional'],
  'Longueur': ['minLength', 'maxLength', 'exactLength'],
  'Format': ['alphanumeric', 'alphaOnly', 'numericOnly', 'uppercase', 'email', 'phone'],
  'Interdit': ['forbiddenPatterns', 'forbiddenValues', 'notPlaceholder'],
  'Date': ['dateNotFuture', 'dateAfter', 'dateBefore', 'dateRange', 'dateNotExpired'],
  'Prefixe/Suffixe': ['startsWith', 'endsWith', 'contains'],
  'Liste': ['inList', 'notInList'],
  'Numerique': ['minValue', 'maxValue', 'valueRange'],
  'Custom': ['customRegex']
};

const RuleEditor: React.FC<RuleEditorProps> = ({ isOpen, rule, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<ValidationRule>>({
    id: '',
    name: '',
    description: '',
    field: '',
    fieldLabel: '',
    clientType: null,
    ruleType: 'required',
    ruleDefinition: [],
    errorMessage: '',
    severity: 'medium',
    isActive: true,
    category: 'Identification'
  });
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or rule changes
  React.useEffect(() => {
    if (isOpen) {
      if (rule) {
        setFormData({ ...rule });
        setConditions(rule.ruleDefinition || []);
      } else {
        setFormData({
          id: `RULE_${Date.now()}`,
          name: '',
          description: '',
          field: '',
          fieldLabel: '',
          clientType: null,
          ruleType: 'required',
          ruleDefinition: [],
          errorMessage: '',
          severity: 'medium',
          isActive: true,
          category: 'Identification'
        });
        setConditions([]);
      }
      setError(null);
    }
  }, [isOpen, rule]);

  const handleFieldChange = (field: string) => {
    setFormData(prev => ({
      ...prev,
      field,
      fieldLabel: FIELD_LABELS[field] || field
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.field || !formData.errorMessage) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    onSave({
      ...formData,
      ruleDefinition: conditions
    } as ValidationRule);
  };

  const addCondition = () => {
    setConditions(prev => [...prev, { type: 'required' }]);
  };

  const removeCondition = (index: number) => {
    setConditions(prev => prev.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    setConditions(prev => prev.map((cond, i) =>
      i === index ? { ...cond, ...updates } : cond
    ));
  };

  const renderConditionInput = (condition: RuleCondition, index: number) => {
    const { type } = condition;

    if (['minLength', 'maxLength', 'exactLength', 'minValue', 'maxValue'].includes(type)) {
      return (
        <input
          type="number"
          placeholder="Valeur"
          value={condition.value?.toString() || ''}
          onChange={(e) => updateCondition(index, { value: parseInt(e.target.value) || 0 })}
          className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    if (['startsWith', 'endsWith', 'contains', 'dateAfter', 'dateBefore', 'customRegex'].includes(type)) {
      return (
        <input
          type={type.startsWith('date') ? 'date' : 'text'}
          placeholder={type === 'customRegex' ? 'Regex' : 'Valeur'}
          value={condition.value?.toString() || ''}
          onChange={(e) => updateCondition(index, { value: e.target.value })}
          className="flex-1 min-w-[120px] px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    if (['dateRange', 'valueRange'].includes(type)) {
      const isDate = type === 'dateRange';
      return (
        <div className="flex items-center gap-1">
          <input
            type={isDate ? 'date' : 'number'}
            placeholder="Min"
            value={condition.min?.toString() || ''}
            onChange={(e) => updateCondition(index, { min: isDate ? e.target.value : parseFloat(e.target.value) })}
            className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-gray-400">-</span>
          <input
            type={isDate ? 'date' : 'number'}
            placeholder="Max"
            value={condition.max?.toString() || ''}
            onChange={(e) => updateCondition(index, { max: isDate ? e.target.value : parseFloat(e.target.value) })}
            className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      );
    }

    if (['forbiddenPatterns', 'forbiddenValues', 'inList', 'notInList'].includes(type)) {
      return (
        <input
          type="text"
          placeholder="val1, val2, val3"
          value={condition.values?.join(', ') || ''}
          onChange={(e) => updateCondition(index, {
            values: e.target.value.split(',').map(v => v.trim()).filter(Boolean)
          })}
          className="flex-1 min-w-[150px] px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {rule ? 'Modifier la Regle' : 'Nouvelle Regle de Validation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Name + Client Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la regle <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Validation NID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de client
              </label>
              <select
                value={formData.clientType || ''}
                onChange={(e) => setFormData({ ...formData, clientType: e.target.value ? e.target.value as '1' | '2' | '3' : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tous les types</option>
                <option value="1">Particuliers</option>
                <option value="2">Entreprises</option>
                <option value="3">Institutionnels</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la regle..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Field + Rule Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Champ a controler <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.field || ''}
                onChange={(e) => handleFieldChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">-- Selectionner --</option>
                {AVAILABLE_FIELDS.map(field => (
                  <option key={field} value={field}>
                    {field} - {FIELD_LABELS[field]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de regle
              </label>
              <select
                value={formData.ruleType || 'required'}
                onChange={(e) => setFormData({ ...formData, ruleType: e.target.value as 'required' | 'format' | 'date' | 'custom' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="required">Obligatoire</option>
                <option value="format">Format</option>
                <option value="date">Date</option>
                <option value="custom">Personnalise</option>
              </select>
            </div>
          </div>

          {/* Severity + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severite
              </label>
              <select
                value={formData.severity || 'medium'}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="critical">Critique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categorie
              </label>
              <Input
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: Identification"
              />
            </div>
          </div>

          {/* Error Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message d'erreur <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.errorMessage || ''}
              onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
              placeholder="Message affiche en cas d'erreur"
              required
            />
          </div>

          {/* Conditions Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Conditions de validation ({conditions.length})
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={addCondition}
              >
                Ajouter
              </Button>
            </div>

            {conditions.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500 text-sm">Aucune condition</p>
                <p className="text-gray-400 text-xs mt-1">Cliquez sur "Ajouter" pour definir des conditions</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conditions.map((condition, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={condition.type}
                        onChange={(e) => updateCondition(index, { type: e.target.value as NaturalRuleType })}
                        className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Object.entries(RULE_TYPE_CATEGORIES).map(([category, types]) => (
                          <optgroup key={category} label={category}>
                            {types.map(type => (
                              <option key={type} value={type}>
                                {RULE_TYPE_LABELS[type]}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      {renderConditionInput(condition, index)}

                      <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Message personnalise (optionnel)"
                      value={condition.message || ''}
                      onChange={(e) => updateCondition(index, { message: e.target.value || undefined })}
                      className="w-full mt-2 px-2 py-1 border border-gray-200 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive ?? true}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Regle active
            </label>
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              fullWidth
            >
              Annuler
            </Button>
            <Button
              type="submit"
              fullWidth
              leftIcon={<Save className="h-4 w-4" />}
            >
              {rule ? 'Modifier' : 'Creer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ValidationRulesManager;
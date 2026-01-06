import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Save, X, AlertTriangle, CheckCircle } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { ValidationRule } from '../../../types/ValidationRules';
import { validationRulesService } from '../../../services/validationRules';
import { useToast } from '../../../components/ui/Toaster';

const ValidationRulesManager: React.FC = () => {
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [selectedClientType, setSelectedClientType] = useState<'1' | '2' | '3' | 'all'>('all');
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    loadRules();
  }, [selectedClientType]);

  const loadRules = () => {
    if (selectedClientType === 'all') {
      setRules(validationRulesService.getRules());
    } else {
      setRules(validationRulesService.getRulesByClientType(selectedClientType));
    }
  };

  const handleToggleRule = (ruleId: string) => {
    if (validationRulesService.toggleRule(ruleId)) {
      loadRules();
      addToast('Règle mise à jour avec succès', 'success');
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      if (validationRulesService.deleteRule(ruleId)) {
        loadRules();
        addToast('Règle supprimée avec succès', 'success');
      }
    }
  };

  const handleSaveRule = (rule: ValidationRule) => {
    if (editingRule) {
      if (validationRulesService.updateRule(rule.id, rule)) {
        addToast('Règle mise à jour avec succès', 'success');
      }
    } else {
      validationRulesService.addRule(rule);
      addToast('Règle créée avec succès', 'success');
    }
    
    setEditingRule(null);
    setIsCreating(false);
    loadRules();
  };

  const getClientTypeLabel = (type: string) => {
    switch (type) {
      case '1': return 'Particuliers';
      case '2': return 'Entreprises';
      case '3': return 'Institutionnels';
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
        
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsCreating(true)}
        >
          Nouvelle Règle
        </Button>
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

          {filteredRules.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Aucune règle trouvée</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal d'édition/création */}
      {(editingRule || isCreating) && (
        <RuleEditor
          rule={editingRule}
          onSave={handleSaveRule}
          onCancel={() => {
            setEditingRule(null);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
};

interface RuleEditorProps {
  rule: ValidationRule | null;
  onSave: (rule: ValidationRule) => void;
  onCancel: () => void;
}

const RuleEditor: React.FC<RuleEditorProps> = ({ rule, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<ValidationRule>>(
    rule || {
      id: `RULE_${Date.now()}`,
      name: '',
      description: '',
      field: '',
      clientType: '1',
      ruleType: 'required',
      condition: '',
      errorMessage: '',
      severity: 'medium',
      isActive: true,
      category: 'Identification'
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.field && formData.errorMessage) {
      onSave(formData as ValidationRule);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {rule ? 'Modifier la Règle' : 'Nouvelle Règle'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom de la règle"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de client
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.clientType || '1'}
                onChange={(e) => setFormData({ ...formData, clientType: e.target.value as any })}
              >
                <option value="1">Particuliers</option>
                <option value="2">Entreprises</option>
                <option value="3">Institutionnels</option>
              </select>
            </div>
          </div>

          <Input
            label="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Champ à contrôler"
              value={formData.field || ''}
              onChange={(e) => setFormData({ ...formData, field: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de règle
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.ruleType || 'required'}
                onChange={(e) => setFormData({ ...formData, ruleType: e.target.value as any })}
              >
                <option value="required">Obligatoire</option>
                <option value="format">Format</option>
                <option value="length">Longueur</option>
                <option value="date">Date</option>
                <option value="custom">Personnalisé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sévérité
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.severity || 'medium'}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="critical">Critique</option>
              </select>
            </div>

            <Input
              label="Catégorie"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <Input
            label="Message d'erreur"
            value={formData.errorMessage || ''}
            onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition SQL
            </label>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              rows={3}
              value={formData.condition || ''}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              placeholder="Ex: NOT NULL AND TRIM(field) != ''"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive || false}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Règle active
            </label>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Sauvegarder
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ValidationRulesManager;
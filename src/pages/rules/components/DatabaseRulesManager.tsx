import React, { useState, useEffect } from 'react';
import { Database, Plus, Edit, Trash2, Save, X, AlertTriangle, CheckCircle, Table } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/Toaster';

interface DatabaseRule {
  id: string;
  name: string;
  description: string;
  table: string;
  field: string;
  condition: string;
  errorMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  category: string;
}

interface DatabaseRulesManagerProps {
  onRulesUpdate?: (rules: DatabaseRule[]) => void;
}

const DatabaseRulesManager: React.FC<DatabaseRulesManagerProps> = ({ onRulesUpdate }) => {
  const [rules, setRules] = useState<DatabaseRule[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [editingRule, setEditingRule] = useState<DatabaseRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  const tables = [
    { name: 'bkcli', description: 'Table des clients' },
    { name: 'bkcom', description: 'Table des comptes' },
    { name: 'bkadcli', description: 'Table des adresses clients' },
    { name: 'bkprfcli', description: 'Table des profils clients' },
    { name: 'bkcntcli', description: 'Table des contacts clients' },
    { name: 'bkemacli', description: 'Table des emails clients' }
  ];

  useEffect(() => {
    loadDefaultRules();
  }, []);

  useEffect(() => {
    if (onRulesUpdate) {
      onRulesUpdate(rules);
    }
  }, [rules, onRulesUpdate]);

  const loadDefaultRules = () => {
    const defaultRules: DatabaseRule[] = [
      // Règles pour bkcli
      {
        id: 'BKCLI_DNA_MIN_1915',
        name: 'Date de naissance > 1915',
        description: 'La date de naissance doit être supérieure à 1915',
        table: 'bkcli',
        field: 'dna',
        condition: 'dna IS NOT NULL AND dna >= "1915-01-01"',
        errorMessage: 'La date de naissance doit être supérieure à 1915',
        severity: 'high',
        isActive: true,
        category: 'Cohérence Temporelle'
      },
      {
        id: 'BKCLI_VID_VALIDITY',
        name: 'Date expiration PI valide',
        description: 'La date d\'expiration de la pièce d\'identité doit être en cours de validité',
        table: 'bkcli',
        field: 'vid',
        condition: 'vid IS NULL OR vid >= CURDATE()',
        errorMessage: 'La date d\'expiration de la pièce d\'identité doit être en cours de validité',
        severity: 'critical',
        isActive: true,
        category: 'Validité Documents'
      },
      {
        id: 'BKCLI_NID_NO_SPECIAL',
        name: 'Numéro PI sans caractères spéciaux',
        description: 'Le numéro de pièce d\'identité ne doit pas contenir de caractères spéciaux',
        table: 'bkcli',
        field: 'nid',
        condition: 'nid IS NOT NULL AND nid REGEXP "^[A-Za-z0-9]+$"',
        errorMessage: 'Le numéro de pièce d\'identité ne doit pas contenir de caractères spéciaux',
        severity: 'high',
        isActive: true,
        category: 'Format Documents'
      },
      {
        id: 'BKCLI_NAT_REQUIRED',
        name: 'Nationalité obligatoire',
        description: 'La nationalité doit être renseignée',
        table: 'bkcli',
        field: 'nat',
        condition: 'nat IS NOT NULL AND TRIM(nat) != ""',
        errorMessage: 'La nationalité doit être renseignée',
        severity: 'medium',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'BKCLI_NOM_REQUIRED',
        name: 'Nom obligatoire',
        description: 'Le nom du client est obligatoire',
        table: 'bkcli',
        field: 'nom',
        condition: 'nom IS NOT NULL AND TRIM(nom) != ""',
        errorMessage: 'Le nom du client est obligatoire',
        severity: 'critical',
        isActive: true,
        category: 'Identification'
      },
      {
        id: 'BKCLI_TCLI_VALID',
        name: 'Type client valide',
        description: 'Le type de client doit être 1, 2 ou 3',
        table: 'bkcli',
        field: 'tcli',
        condition: 'tcli IN ("1", "2", "3")',
        errorMessage: 'Le type de client doit être 1 (Particulier), 2 (Entreprise) ou 3 (Institutionnel)',
        severity: 'critical',
        isActive: true,
        category: 'Classification'
      },

      // Règles pour bkcom
      {
        id: 'BKCOM_CLI_REFERENCE',
        name: 'Référence client valide',
        description: 'Le code client doit exister dans la table bkcli',
        table: 'bkcom',
        field: 'cli',
        condition: 'cli IS NOT NULL AND EXISTS (SELECT 1 FROM bkcli WHERE bkcli.cli = bkcom.cli)',
        errorMessage: 'Le code client doit exister dans la table des clients',
        severity: 'critical',
        isActive: true,
        category: 'Intégrité Référentielle'
      },
      {
        id: 'BKCOM_SOLDE_COHERENCE',
        name: 'Cohérence des soldes',
        description: 'Le solde disponible ne peut pas être négatif pour les comptes d\'épargne',
        table: 'bkcom',
        field: 'sde',
        condition: 'typ != "EPG" OR sde >= 0',
        errorMessage: 'Le solde disponible ne peut pas être négatif pour un compte d\'épargne',
        severity: 'high',
        isActive: true,
        category: 'Cohérence Métier'
      },

      // Règles pour bkemacli
      {
        id: 'BKEMACLI_EMAIL_FORMAT',
        name: 'Format email valide',
        description: 'L\'adresse email doit avoir un format valide',
        table: 'bkemacli',
        field: 'email',
        condition: 'email IS NOT NULL AND email REGEXP "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"',
        errorMessage: 'L\'adresse email doit avoir un format valide',
        severity: 'medium',
        isActive: true,
        category: 'Format Contact'
      },
      {
        id: 'BKEMACLI_CLI_REFERENCE',
        name: 'Référence client email valide',
        description: 'Le code client doit exister dans la table bkcli',
        table: 'bkemacli',
        field: 'cli',
        condition: 'cli IS NOT NULL AND EXISTS (SELECT 1 FROM bkcli WHERE bkcli.cli = bkemacli.cli)',
        errorMessage: 'Le code client doit exister dans la table des clients',
        severity: 'critical',
        isActive: true,
        category: 'Intégrité Référentielle'
      }
    ];

    setRules(defaultRules);
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
    addToast('Règle mise à jour avec succès', 'success');
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      addToast('Règle supprimée avec succès', 'success');
    }
  };

  const handleSaveRule = (rule: DatabaseRule) => {
    if (editingRule) {
      setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
      addToast('Règle mise à jour avec succès', 'success');
    } else {
      setRules(prev => [...prev, rule]);
      addToast('Règle créée avec succès', 'success');
    }
    
    setEditingRule(null);
    setIsCreating(false);
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

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTable = selectedTable === 'all' || rule.table === selectedTable;
    return matchesSearch && matchesTable;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Règles de Contrôle Base de Données</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les règles de validation pour les tables MySQL
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
              <Button
                variant={selectedTable === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedTable('all')}
              >
                Toutes les tables
              </Button>
              {tables.map((table) => (
                <Button
                  key={table.name}
                  variant={selectedTable === table.name ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTable(table.name)}
                >
                  {table.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Informations sur les tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <Card key={table.name} className="border-primary-200 bg-primary-50">
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Table className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-medium text-primary-800">{table.name}</h3>
              </div>
              <p className="text-sm text-primary-700">{table.description}</p>
              <div className="mt-2 text-xs text-primary-600">
                {filteredRules.filter(r => r.table === table.name).length} règles configurées
              </div>
            </div>
          </Card>
        ))}
      </div>

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
                    Table
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Champ
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
                      <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">
                        {rule.table}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">{rule.field}</code>
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
        <DatabaseRuleEditor
          rule={editingRule}
          tables={tables}
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

interface DatabaseRuleEditorProps {
  rule: DatabaseRule | null;
  tables: Array<{ name: string; description: string }>;
  onSave: (rule: DatabaseRule) => void;
  onCancel: () => void;
}

const DatabaseRuleEditor: React.FC<DatabaseRuleEditorProps> = ({ rule, tables, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<DatabaseRule>>(
    rule || {
      id: `DB_RULE_${Date.now()}`,
      name: '',
      description: '',
      table: 'bkcli',
      field: '',
      condition: '',
      errorMessage: '',
      severity: 'medium',
      isActive: true,
      category: 'Validation'
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.table && formData.field && formData.condition && formData.errorMessage) {
      onSave(formData as DatabaseRule);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {rule ? 'Modifier la Règle' : 'Nouvelle Règle de Base de Données'}
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
                Table
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.table || 'bkcli'}
                onChange={(e) => setFormData({ ...formData, table: e.target.value })}
              >
                {tables.map((table) => (
                  <option key={table.name} value={table.name}>
                    {table.name} - {table.description}
                  </option>
                ))}
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition SQL
            </label>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              rows={3}
              value={formData.condition || ''}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              placeholder="Ex: field IS NOT NULL AND field != ''"
              required
            />
          </div>

          <Input
            label="Message d'erreur"
            value={formData.errorMessage || ''}
            onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
            required
          />

          <Input
            label="Catégorie"
            value={formData.category || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />

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

export default DatabaseRulesManager;
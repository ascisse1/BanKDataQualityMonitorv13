import { useState, useEffect, useCallback } from 'react';
import {
  Database, Plus, Edit, Trash2, Search, X, Save, RefreshCw,
  Table2, Columns3, BookOpen, ChevronRight, Check, Download
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toaster';
import {
  dataDictionaryService,
  CbsTable,
  CbsField,
  NomenclatureType,
  NomenclatureEntry,
} from '../../services/dataDictionaryService';
import { log } from '../../services/log';

// ── Types ───────────────────────────────────────────────────────

type Tab = 'tables' | 'fields' | 'nomenclatures';

const DATA_TYPES = ['CHAR', 'VARCHAR', 'INTEGER', 'SMALLINT', 'DECIMAL', 'DATE', 'DATETIME', 'BOOLEAN'] as const;

const FIELD_GROUPS = [
  'identity', 'document', 'family', 'legal', 'enterprise',
  'classification', 'management', 'regulatory', 'restrictions', 'audit', 'custom',
] as const;

const FIELD_GROUP_LABELS: Record<string, string> = {
  identity: 'Identite',
  document: 'Documents',
  family: 'Famille',
  legal: 'Juridique',
  enterprise: 'Entreprise',
  classification: 'Classification',
  management: 'Gestion',
  regulatory: 'Reglementaire',
  restrictions: 'Restrictions',
  audit: 'Audit',
  custom: 'Personnalise',
};

// ── Helpers ─────────────────────────────────────────────────────

const hasLengthField = (dt: string) => ['CHAR', 'VARCHAR'].includes(dt);
const hasPrecisionField = (dt: string) => dt === 'DECIMAL';

const formatDate = (iso: string | null) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

// ── Main Component ──────────────────────────────────────────────

const DataDictionaryPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('tables');
  const [tables, setTables] = useState<CbsTable[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Modal states
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<CbsTable | null>(null);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<CbsField | null>(null);
  const [showNomTypeModal, setShowNomTypeModal] = useState(false);
  const [editingNomType, setEditingNomType] = useState<NomenclatureType | null>(null);

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dataDictionaryService.getTables();
      setTables(res.data || []);
    } catch (err) {
      log.error('api', 'Failed to load CBS tables', { error: err });
      addToast('Erreur lors du chargement des tables', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);

  // ── Stats ───────────────────────────────────────────────────

  const activeTables = tables.filter(t => t.active);
  const syncEnabledCount = tables.filter(t => t.syncEnabled).length;
  const totalFields = tables.reduce((sum, t) => sum + (t.fieldCount || 0), 0);

  const stats = [
    { label: 'Tables CBS', value: activeTables.length, icon: Table2, color: 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20' },
    { label: 'Champs total', value: totalFields, icon: Columns3, color: 'text-accent-600 bg-accent-50 dark:text-accent-400 dark:bg-accent-900/20' },
    { label: 'Sync actives', value: syncEnabledCount, icon: RefreshCw, color: 'text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-900/20' },
    { label: 'Nomenclatures', value: '-', icon: BookOpen, color: 'text-gold-600 bg-gold-50 dark:text-gold-400 dark:bg-gold-900/20' },
  ];

  // ── Tab definitions ──────────────────────────────────────────

  const tabsList: { key: Tab; label: string; icon: typeof Database }[] = [
    { key: 'tables', label: 'Tables CBS', icon: Table2 },
    { key: 'fields', label: 'Champs', icon: Columns3 },
    { key: 'nomenclatures', label: 'Nomenclatures', icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dictionnaire de donnees CBS
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerez les tables, champs et nomenclatures du systeme bancaire
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadTables} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-surface-700">
        <nav className="flex gap-1">
          {tabsList.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'tables' && (
        <TablesTab
          tables={tables}
          showModal={showTableModal}
          setShowModal={setShowTableModal}
          editing={editingTable}
          setEditing={setEditingTable}
          onReload={loadTables}
          addToast={addToast}
        />
      )}
      {activeTab === 'fields' && (
        <FieldsTab
          tables={tables}
          showModal={showFieldModal}
          setShowModal={setShowFieldModal}
          editing={editingField}
          setEditing={setEditingField}
          onReload={loadTables}
          addToast={addToast}
        />
      )}
      {activeTab === 'nomenclatures' && (
        <NomenclaturesTab
          showTypeModal={showNomTypeModal}
          setShowTypeModal={setShowNomTypeModal}
          editingType={editingNomType}
          setEditingType={setEditingNomType}
          addToast={addToast}
        />
      )}
    </div>
  );
};

// ── Tables Tab ──────────────────────────────────────────────────

interface TablesTabProps {
  tables: CbsTable[];
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  editing: CbsTable | null;
  setEditing: (v: CbsTable | null) => void;
  onReload: () => void;
  addToast: (msg: string, type?: string) => void;
}

const TablesTab = ({ tables, showModal, setShowModal, editing, setEditing, onReload, addToast }: TablesTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Form state
  const [formTableName, setFormTableName] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSchemaName, setFormSchemaName] = useState('');
  const [formCbsVersion, setFormCbsVersion] = useState('');
  const [formPrimaryKeyColumns, setFormPrimaryKeyColumns] = useState('');
  const [formSyncEnabled, setFormSyncEnabled] = useState(false);
  const [formSyncOrder, setFormSyncOrder] = useState(0);

  const resetForm = () => {
    setFormTableName('');
    setFormDisplayName('');
    setFormDescription('');
    setFormSchemaName('');
    setFormCbsVersion('');
    setFormPrimaryKeyColumns('');
    setFormSyncEnabled(false);
    setFormSyncOrder(0);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (t: CbsTable) => {
    setEditing(t);
    setFormTableName(t.tableName);
    setFormDisplayName(t.displayName || '');
    setFormDescription(t.description || '');
    setFormSchemaName(t.schemaName || '');
    setFormCbsVersion(t.cbsVersion || '');
    setFormPrimaryKeyColumns(t.primaryKeyColumns || '');

    setFormSyncEnabled(t.syncEnabled);
    setFormSyncOrder(t.syncOrder || 0);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTableName || !formDisplayName) {
      addToast('Veuillez remplir les champs obligatoires', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<CbsTable> = {
        tableName: formTableName,
        displayName: formDisplayName,
        description: formDescription,
        schemaName: formSchemaName,
        cbsVersion: formCbsVersion,
        primaryKeyColumns: formPrimaryKeyColumns,
        syncEnabled: formSyncEnabled,
        syncOrder: formSyncOrder,
      };
      if (editing) {
        await dataDictionaryService.updateTable(editing.id, payload);
        addToast('Table mise a jour', 'success');
      } else {
        await dataDictionaryService.createTable(payload);
        addToast('Table creee', 'success');
      }
      setShowModal(false);
      resetForm();
      onReload();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette table ? Cette action est irreversible.')) return;
    try {
      await dataDictionaryService.deleteTable(id);
      addToast('Table supprimee', 'success');
      onReload();
    } catch {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const filtered = tables.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.tableName.toLowerCase().includes(q) ||
           t.displayName?.toLowerCase().includes(q) ||
           t.cbsVersion?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle table
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-surface-700 bg-slate-50 dark:bg-surface-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Libelle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Version CBS</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Sync</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Champs</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-700">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900 dark:text-white font-mono">{t.tableName}</p>
                    {t.schemaName && <p className="text-xs text-slate-400">{t.schemaName}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-900 dark:text-white">{t.displayName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 dark:bg-surface-700 dark:text-slate-300">
                      {t.cbsVersion || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      t.syncEnabled
                        ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-surface-700 dark:text-slate-400'
                    }`}>
                      {t.syncEnabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {t.syncEnabled ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400">
                      {t.fieldCount || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    {searchQuery ? 'Aucun resultat pour cette recherche' : 'Aucune table configuree'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editing ? 'Modifier la table' : 'Nouvelle table'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-700">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom de la table *</label>
                  <input
                    type="text"
                    value={formTableName}
                    onChange={(e) => setFormTableName(e.target.value)}
                    placeholder="ex: BKCLI"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Libelle *</label>
                  <input
                    type="text"
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    placeholder="ex: Clients"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Schema</label>
                  <input
                    type="text"
                    value={formSchemaName}
                    onChange={(e) => setFormSchemaName(e.target.value)}
                    placeholder="ex: informix"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Version CBS</label>
                  <input
                    type="text"
                    value={formCbsVersion}
                    onChange={(e) => setFormCbsVersion(e.target.value)}
                    placeholder="ex: 10.7"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Colonnes cle primaire</label>
                <input
                  type="text"
                  value={formPrimaryKeyColumns}
                  onChange={(e) => setFormPrimaryKeyColumns(e.target.value)}
                  placeholder="ex: cli,age"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="syncEnabled"
                    checked={formSyncEnabled}
                    onChange={(e) => setFormSyncEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="syncEnabled" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Synchronisation activee
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ordre de sync</label>
                  <input
                    type="number"
                    value={formSyncOrder}
                    onChange={(e) => setFormSyncOrder(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowModal(false); resetForm(); }}>
                Annuler
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Enregistrement...' : editing ? 'Mettre a jour' : 'Creer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Fields Tab ──────────────────────────────────────────────────

interface FieldsTabProps {
  tables: CbsTable[];
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  editing: CbsField | null;
  setEditing: (v: CbsField | null) => void;
  onReload: () => void;
  addToast: (msg: string, type?: string) => void;
}

const FieldsTab = ({ tables, showModal, setShowModal, editing, setEditing, onReload, addToast }: FieldsTabProps) => {
  const [selectedTableId, setSelectedTableId] = useState<number | ''>('');
  const [fields, setFields] = useState<CbsField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formColumnName, setFormColumnName] = useState('');
  const [formDisplayLabel, setFormDisplayLabel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formQueryAlias, setFormQueryAlias] = useState('');
  const [formDataType, setFormDataType] = useState('VARCHAR');
  const [formMaxLength, setFormMaxLength] = useState<number | ''>('');
  const [formPrecisionValue, setFormPrecisionValue] = useState<number | ''>('');
  const [formScaleValue, setFormScaleValue] = useState<number | ''>('');
  const [formIsPrimaryKey, setFormIsPrimaryKey] = useState(false);
  const [formIsRequired, setFormIsRequired] = useState(false);
  const [formIsUpdatable, setFormIsUpdatable] = useState(true);
  const [formNomenclatureCtab, setFormNomenclatureCtab] = useState('');
  const [formNomenclatureDescription, setFormNomenclatureDescription] = useState('');
  const [formEnumValues, setFormEnumValues] = useState('');
  const [formApplicableClientTypes, setFormApplicableClientTypes] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formFieldGroup, setFormFieldGroup] = useState('identity');

  const loadFields = useCallback(async (tableId: number) => {
    setLoadingFields(true);
    try {
      const res = await dataDictionaryService.getFields(tableId);
      setFields(res.data || []);
    } catch (err) {
      log.error('api', 'Failed to load fields', { error: err });
      addToast('Erreur lors du chargement des champs', 'error');
    } finally {
      setLoadingFields(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (selectedTableId) {
      loadFields(selectedTableId as number);
    } else {
      setFields([]);
    }
  }, [selectedTableId, loadFields]);

  const resetForm = () => {
    setFormColumnName('');
    setFormDisplayLabel('');
    setFormDescription('');
    setFormQueryAlias('');
    setFormDataType('VARCHAR');
    setFormMaxLength('');
    setFormPrecisionValue('');
    setFormScaleValue('');
    setFormIsPrimaryKey(false);
    setFormIsRequired(false);
    setFormIsUpdatable(true);
    setFormNomenclatureCtab('');
    setFormNomenclatureDescription('');
    setFormEnumValues('');
    setFormApplicableClientTypes('');
    setFormDisplayOrder(0);
    setFormFieldGroup('identity');
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (f: CbsField) => {
    setEditing(f);
    setFormColumnName(f.columnName);
    setFormDisplayLabel(f.displayLabel || '');
    setFormDescription(f.description || '');

    setFormQueryAlias(f.queryAlias || '');
    setFormDataType(f.dataType || 'VARCHAR');
    setFormMaxLength(f.maxLength ?? '');
    setFormPrecisionValue(f.precisionValue ?? '');
    setFormScaleValue(f.scaleValue ?? '');
    setFormIsPrimaryKey(f.isPrimaryKey);
    setFormIsRequired(f.isRequired);
    setFormIsUpdatable(f.isUpdatable);
    setFormNomenclatureCtab(f.nomenclatureCtab || '');
    setFormNomenclatureDescription(f.nomenclatureDescription || '');
    setFormEnumValues(f.enumValues || '');
    setFormApplicableClientTypes(f.applicableClientTypes || '');
    setFormDisplayOrder(f.displayOrder || 0);
    setFormFieldGroup(f.fieldGroup || 'identity');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formColumnName || !formDisplayLabel) {
      addToast('Veuillez remplir les champs obligatoires', 'error');
      return;
    }
    if (!selectedTableId && !editing) {
      addToast('Veuillez selectionner une table', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<CbsField> = {
        columnName: formColumnName,
        displayLabel: formDisplayLabel,
        description: formDescription,
        queryAlias: formQueryAlias,
        dataType: formDataType,
        maxLength: formMaxLength === '' ? null : Number(formMaxLength),
        precisionValue: formPrecisionValue === '' ? null : Number(formPrecisionValue),
        scaleValue: formScaleValue === '' ? null : Number(formScaleValue),
        isPrimaryKey: formIsPrimaryKey,
        isRequired: formIsRequired,
        isUpdatable: formIsUpdatable,
        nomenclatureCtab: formNomenclatureCtab || null,
        nomenclatureDescription: formNomenclatureDescription || null,
        enumValues: formEnumValues || null,
        applicableClientTypes: formApplicableClientTypes || null,
        displayOrder: formDisplayOrder,
        fieldGroup: formFieldGroup,
      };
      if (editing) {
        await dataDictionaryService.updateField(editing.id, payload);
        addToast('Champ mis a jour', 'success');
      } else {
        await dataDictionaryService.createField(selectedTableId as number, payload);
        addToast('Champ cree', 'success');
      }
      setShowModal(false);
      resetForm();
      if (selectedTableId) loadFields(selectedTableId as number);
      onReload();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce champ ? Cette action est irreversible.')) return;
    try {
      await dataDictionaryService.deleteField(id);
      addToast('Champ supprime', 'success');
      if (selectedTableId) loadFields(selectedTableId as number);
      onReload();
    } catch {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const selectedTable = tables.find(t => t.id === selectedTableId);

  return (
    <div className="space-y-4">
      {/* Table selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Table CBS</label>
          <select
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm text-slate-900 dark:text-white"
          >
            <option value="">Selectionner une table</option>
            {tables.filter(t => t.active).map(t => (
              <option key={t.id} value={t.id}>{t.tableName} - {t.displayName}</option>
            ))}
          </select>
        </div>
        {selectedTableId && (
          <div className="flex items-center gap-2 pt-6">
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau champ
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadFields(selectedTableId as number)} disabled={loadingFields}>
              <RefreshCw className={`w-4 h-4 ${loadingFields ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      {/* Fields table */}
      {selectedTableId ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-surface-700 bg-slate-50 dark:bg-surface-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Colonne</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Libelle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Taille</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Requis</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Modifiable</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nomenclature</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Groupe</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-surface-700">
                {fields.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {f.isPrimaryKey && (
                          <span className="text-gold-500" title="Cle primaire">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                          </span>
                        )}
                        <p className="text-sm font-medium text-slate-900 dark:text-white font-mono">{f.columnName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-900 dark:text-white">{f.displayLabel}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-600 dark:bg-surface-700 dark:text-slate-300">
                        {f.dataType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600 dark:text-slate-400">
                      {f.maxLength ?? (f.precisionValue ? `${f.precisionValue},${f.scaleValue || 0}` : '-')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.isRequired ? (
                        <Check className="w-4 h-4 text-success-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.isUpdatable ? (
                        <Check className="w-4 h-4 text-success-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {f.nomenclatureCtab ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400">
                          {f.nomenclatureCtab}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {FIELD_GROUP_LABELS[f.fieldGroup] || f.fieldGroup || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
                      {loadingFields ? 'Chargement...' : 'Aucun champ pour cette table'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Columns3 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Selectionnez une table pour afficher ses champs
            </p>
          </div>
        </Card>
      )}

      {/* Field Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editing ? 'Modifier le champ' : 'Nouveau champ'}
                {selectedTable && (
                  <span className="text-sm font-normal text-slate-400 ml-2">({selectedTable.tableName})</span>
                )}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-700">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Identity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom de colonne *</label>
                  <input
                    type="text"
                    value={formColumnName}
                    onChange={(e) => setFormColumnName(e.target.value)}
                    placeholder="ex: nom"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Libelle *</label>
                  <input
                    type="text"
                    value={formDisplayLabel}
                    onChange={(e) => setFormDisplayLabel(e.target.value)}
                    placeholder="ex: Nom du client"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alias requete</label>
                  <input
                    type="text"
                    value={formQueryAlias}
                    onChange={(e) => setFormQueryAlias(e.target.value)}
                    placeholder="ex: clientName"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Data type & sizing */}
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type de donnee</label>
                  <select
                    value={formDataType}
                    onChange={(e) => setFormDataType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  >
                    {DATA_TYPES.map(dt => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                </div>
                {hasLengthField(formDataType) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Taille max</label>
                    <input
                      type="number"
                      value={formMaxLength}
                      onChange={(e) => setFormMaxLength(e.target.value ? Number(e.target.value) : '')}
                      min={0}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                )}
                {hasPrecisionField(formDataType) && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Precision</label>
                      <input
                        type="number"
                        value={formPrecisionValue}
                        onChange={(e) => setFormPrecisionValue(e.target.value ? Number(e.target.value) : '')}
                        min={0}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Echelle</label>
                      <input
                        type="number"
                        value={formScaleValue}
                        onChange={(e) => setFormScaleValue(e.target.value ? Number(e.target.value) : '')}
                        min={0}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Flags */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimaryKey"
                    checked={formIsPrimaryKey}
                    onChange={(e) => setFormIsPrimaryKey(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isPrimaryKey" className="text-sm text-slate-700 dark:text-slate-300">Cle primaire</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={formIsRequired}
                    onChange={(e) => setFormIsRequired(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isRequired" className="text-sm text-slate-700 dark:text-slate-300">Obligatoire</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isUpdatable"
                    checked={formIsUpdatable}
                    onChange={(e) => setFormIsUpdatable(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="isUpdatable" className="text-sm text-slate-700 dark:text-slate-300">Modifiable</label>
                </div>
              </div>

              {/* Nomenclature */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nomenclature (ctab)</label>
                  <input
                    type="text"
                    value={formNomenclatureCtab}
                    onChange={(e) => setFormNomenclatureCtab(e.target.value)}
                    placeholder="ex: CPY"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description nomenclature</label>
                  <input
                    type="text"
                    value={formNomenclatureDescription}
                    onChange={(e) => setFormNomenclatureDescription(e.target.value)}
                    placeholder="ex: Pays"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Enum values */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valeurs enum (JSON)</label>
                <textarea
                  value={formEnumValues}
                  onChange={(e) => setFormEnumValues(e.target.value)}
                  rows={2}
                  placeholder='ex: {"P": "Physique", "M": "Morale"}'
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white font-mono resize-none"
                />
              </div>

              {/* Client types & ordering */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Types client (CSV)</label>
                  <input
                    type="text"
                    value={formApplicableClientTypes}
                    onChange={(e) => setFormApplicableClientTypes(e.target.value)}
                    placeholder="ex: P,M"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ordre d'affichage</label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Groupe</label>
                  <select
                    value={formFieldGroup}
                    onChange={(e) => setFormFieldGroup(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  >
                    {FIELD_GROUPS.map(g => (
                      <option key={g} value={g}>{FIELD_GROUP_LABELS[g]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowModal(false); resetForm(); }}>
                Annuler
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Enregistrement...' : editing ? 'Mettre a jour' : 'Creer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Nomenclatures Tab ───────────────────────────────────────────

interface NomenclaturesTabProps {
  showTypeModal: boolean;
  setShowTypeModal: (v: boolean) => void;
  editingType: NomenclatureType | null;
  setEditingType: (v: NomenclatureType | null) => void;
  addToast: (msg: string, type?: string) => void;
}

const NomenclaturesTab = ({ showTypeModal, setShowTypeModal, editingType, setEditingType, addToast }: NomenclaturesTabProps) => {
  const [nomenclatureTypes, setNomenclatureTypes] = useState<NomenclatureType[]>([]);
  const [selectedType, setSelectedType] = useState<NomenclatureType | null>(null);
  const [entries, setEntries] = useState<NomenclatureEntry[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingCtab, setSyncingCtab] = useState<string | null>(null);

  // Form state for type
  const [formCtab, setFormCtab] = useState('');
  const [formName, setFormName] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSyncEnabled, setFormSyncEnabled] = useState(true);

  const loadTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const res = await dataDictionaryService.getNomenclatureTypes();
      setNomenclatureTypes(res.data || []);
    } catch (err) {
      log.error('api', 'Failed to load nomenclature types', { error: err });
      addToast('Erreur lors du chargement des nomenclatures', 'error');
    } finally {
      setLoadingTypes(false);
    }
  }, [addToast]);

  useEffect(() => { loadTypes(); }, [loadTypes]);

  const loadEntries = useCallback(async (ctab: string) => {
    setLoadingEntries(true);
    try {
      const res = await dataDictionaryService.getEntries(ctab);
      setEntries(res.data || []);
    } catch (err) {
      log.error('api', 'Failed to load entries', { error: err });
      addToast('Erreur lors du chargement des entrees', 'error');
    } finally {
      setLoadingEntries(false);
    }
  }, [addToast]);

  const selectType = (t: NomenclatureType) => {
    setSelectedType(t);
    setSearchQuery('');
    loadEntries(t.ctab);
  };

  const resetForm = () => {
    setFormCtab('');
    setFormName('');
    setFormDisplayName('');
    setFormDescription('');
    setFormSyncEnabled(true);
    setEditingType(null);
  };

  const openCreate = () => {
    resetForm();
    setShowTypeModal(true);
  };

  const openEdit = (t: NomenclatureType) => {
    setEditingType(t);
    setFormCtab(t.ctab);
    setFormName(t.name || '');
    setFormDisplayName(t.displayName || '');
    setFormDescription(t.description || '');
    setFormSyncEnabled(t.syncEnabled);
    setShowTypeModal(true);
  };

  const handleSaveType = async () => {
    if (!formCtab || !formName) {
      addToast('Veuillez remplir les champs obligatoires', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<NomenclatureType> = {
        ctab: formCtab,
        name: formName,
        displayName: formDisplayName,
        description: formDescription,
        syncEnabled: formSyncEnabled,
      };
      if (editingType) {
        await dataDictionaryService.updateNomenclatureType(editingType.id, payload);
        addToast('Type de nomenclature mis a jour', 'success');
      } else {
        await dataDictionaryService.createNomenclatureType(payload);
        addToast('Type de nomenclature cree', 'success');
      }
      setShowTypeModal(false);
      resetForm();
      loadTypes();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm('Supprimer ce type de nomenclature ?')) return;
    try {
      await dataDictionaryService.deleteNomenclatureType(id);
      addToast('Type supprime', 'success');
      if (selectedType?.id === id) {
        setSelectedType(null);
        setEntries([]);
      }
      loadTypes();
    } catch {
      addToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await dataDictionaryService.syncAllNomenclatures();
      const results = res.data || [];
      const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
      const totalUpdated = results.reduce((s, r) => s + r.updated, 0);
      addToast(`Sync terminee: ${results.length} nomenclatures, ${totalInserted} inserees, ${totalUpdated} mises a jour`, 'success');
      loadTypes();
      if (selectedType) loadEntries(selectedType.ctab);
    } catch (err) {
      log.error('api', 'Sync all nomenclatures failed', { error: err });
      addToast('Erreur lors de la synchronisation', 'error');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncOne = async (ctab: string) => {
    setSyncingCtab(ctab);
    try {
      const res = await dataDictionaryService.syncNomenclature(ctab);
      const r = res.data;
      addToast(`Sync ${ctab}: ${r.inserted} inserees, ${r.updated} mises a jour (${r.durationMs}ms)`, 'success');
      loadTypes();
      if (selectedType?.ctab === ctab) loadEntries(ctab);
    } catch (err) {
      log.error('api', `Sync ${ctab} failed`, { error: err });
      addToast(`Erreur sync ${ctab}`, 'error');
    } finally {
      setSyncingCtab(null);
    }
  };

  const filteredEntries = entries.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.cacc.toLowerCase().includes(q) ||
           e.lib1?.toLowerCase().includes(q) ||
           e.age?.toLowerCase().includes(q);
  });

  return (
    <div className="flex gap-4" style={{ minHeight: '500px' }}>
      {/* Left panel: types list */}
      <div className="w-1/3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Types de nomenclature</h3>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="xs" onClick={handleSyncAll} disabled={syncingAll}>
              <Download className={`w-3.5 h-3.5 mr-1 ${syncingAll ? 'animate-spin' : ''}`} />
              {syncingAll ? 'Sync...' : 'Sync All'}
            </Button>
            <Button variant="primary" size="xs" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {loadingTypes ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-slate-100 dark:bg-surface-700 rounded-xl h-20" />
            ))}
          </div>
        ) : nomenclatureTypes.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-slate-400 text-center">Aucun type de nomenclature</p>
          </Card>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
            {nomenclatureTypes.map((t) => (
              <div
                key={t.id}
                onClick={() => selectType(t)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedType?.id === t.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                    : 'border-slate-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-primary-300 dark:hover:border-primary-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{t.ctab}</span>
                      {t.entryCount != null && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                          {t.entryCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                      {t.displayName || t.name}
                    </p>
                    {t.lastSyncedAt && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Sync: {formatDate(t.lastSyncedAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 ml-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSyncOne(t.ctab); }}
                      disabled={syncingCtab === t.ctab}
                      className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                      title="Synchroniser"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncingCtab === t.ctab ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                      className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteType(t.id); }}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel: entries */}
      <div className="w-2/3">
        {selectedType ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {selectedType.displayName || selectedType.name}
                  <span className="text-xs font-normal text-slate-400 ml-2">({selectedType.ctab})</span>
                </h3>
                {selectedType.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{selectedType.description}</p>
                )}
              </div>
              <div className="text-xs text-slate-400">
                {filteredEntries.length} entree{filteredEntries.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par code ou libelle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Entries table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto max-h-[calc(100vh-420px)]">
                <table className="w-full">
                  <thead className="sticky top-0">
                    <tr className="border-b border-slate-200 dark:border-surface-700 bg-slate-50 dark:bg-surface-800/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Libelle</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Agence</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-surface-700">
                    {filteredEntries.map((e) => (
                      <tr key={`${e.ctab}-${e.cacc}-${e.age}`} className="hover:bg-slate-50 dark:hover:bg-surface-800/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className="text-sm font-medium text-slate-900 dark:text-white font-mono">{e.cacc}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-sm text-slate-900 dark:text-white">{e.lib1}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{e.age || '-'}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {e.active ? (
                            <Check className="w-4 h-4 text-success-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredEntries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-400">
                          {loadingEntries ? 'Chargement...' : searchQuery ? 'Aucun resultat' : 'Aucune entree'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-12 h-full flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Selectionnez un type de nomenclature pour afficher ses entrees
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Type Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowTypeModal(false); resetForm(); }} />
          <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingType ? 'Modifier le type' : 'Nouveau type de nomenclature'}
              </h3>
              <button onClick={() => { setShowTypeModal(false); resetForm(); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-700">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Code (ctab) *</label>
                  <input
                    type="text"
                    value={formCtab}
                    onChange={(e) => setFormCtab(e.target.value)}
                    disabled={!!editingType}
                    placeholder="ex: CPY"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom technique *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ex: country"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom d'affichage</label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  placeholder="ex: Pays"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="nomSyncEnabled"
                  checked={formSyncEnabled}
                  onChange={(e) => setFormSyncEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="nomSyncEnabled" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Synchronisation activee
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowTypeModal(false); resetForm(); }}>
                Annuler
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveType} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Enregistrement...' : editingType ? 'Mettre a jour' : 'Creer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataDictionaryPage;

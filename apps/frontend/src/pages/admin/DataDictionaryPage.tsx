import { useState, useEffect, useCallback } from 'react';
import {
  Database, Table2, Columns3, BookOpen, RefreshCw,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';
import {
  dataDictionaryService,
  CbsTable,
  CbsField,
  NomenclatureType,
} from '@/services/dataDictionaryService';
import { log } from '@/services/log';
import type { Tab } from './components/dataDictionaryConstants';
import TablesTab from './components/TablesTab';
import FieldsTab from './components/FieldsTab';
import NomenclaturesTab from './components/NomenclaturesTab';

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

export default DataDictionaryPage;

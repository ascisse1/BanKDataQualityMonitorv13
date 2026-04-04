import { useState } from 'react';
import { Plus, Edit, Trash2, Search, X, Save, Check } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  dataDictionaryService,
  CbsTable,
} from '@/services/dataDictionaryService';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { AddToastFn } from './dataDictionaryConstants';

interface TablesTabProps {
  tables: CbsTable[];
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  editing: CbsTable | null;
  setEditing: (v: CbsTable | null) => void;
  onReload: () => void;
  addToast: AddToastFn;
}

const TablesTab = ({ tables, showModal, setShowModal, editing, setEditing, onReload, addToast }: TablesTabProps) => {
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();
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
    const confirmed = await confirm('Supprimer cette table ? Cette action est irreversible.');
    if (!confirmed) return;
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
      <ConfirmDialogPortal />
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

export default TablesTab;

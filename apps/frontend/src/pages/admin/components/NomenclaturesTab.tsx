import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Search, X, Save, Check, RefreshCw, BookOpen, Download,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  dataDictionaryService,
  NomenclatureType,
  NomenclatureEntry,
} from '@/services/dataDictionaryService';
import { log } from '@/services/log';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDate } from './dataDictionaryConstants';
import type { AddToastFn } from './dataDictionaryConstants';

interface NomenclaturesTabProps {
  showTypeModal: boolean;
  setShowTypeModal: (v: boolean) => void;
  editingType: NomenclatureType | null;
  setEditingType: (v: NomenclatureType | null) => void;
  addToast: AddToastFn;
}

const NomenclaturesTab = ({ showTypeModal, setShowTypeModal, editingType, setEditingType, addToast }: NomenclaturesTabProps) => {
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();
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
    const confirmed = await confirm('Supprimer ce type de nomenclature ?');
    if (!confirmed) return;
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
      const totalInserted = results.reduce((s: number, r: { inserted: number }) => s + r.inserted, 0);
      const totalUpdated = results.reduce((s: number, r: { updated: number }) => s + r.updated, 0);
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
      <ConfirmDialogPortal />
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

export default NomenclaturesTab;

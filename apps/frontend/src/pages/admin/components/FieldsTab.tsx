import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Check, X, Columns3, RefreshCw, Save } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  dataDictionaryService,
  CbsTable,
  CbsField,
} from '@/services/dataDictionaryService';
import { log } from '@/services/log';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  DATA_TYPES,
  FIELD_GROUPS,
  FIELD_GROUP_LABELS,
  hasLengthField,
  hasPrecisionField,
} from './dataDictionaryConstants';
import type { AddToastFn } from './dataDictionaryConstants';

interface FieldsTabProps {
  tables: CbsTable[];
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  editing: CbsField | null;
  setEditing: (v: CbsField | null) => void;
  onReload: () => void;
  addToast: AddToastFn;
}

const FieldsTab = ({ tables, showModal, setShowModal, editing, setEditing, onReload, addToast }: FieldsTabProps) => {
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();
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
    const confirmed = await confirm('Supprimer ce champ ? Cette action est irreversible.');
    if (!confirmed) return;
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
      <ConfirmDialogPortal />
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

export default FieldsTab;

import { useState } from 'react';
import {
  Building2, Plus, Edit, Trash2, Search, X, Save,
  Calendar, Check,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import apiClient from '@/lib/apiClient';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { UserProfile, Structure, AppProfile, UserOption } from './userAccessTypes';

// ── Props ──────────────────────────────────────────────────────

interface AssignmentsTabProps {
  assignments: UserProfile[];
  structures: Structure[];
  profiles: AppProfile[];
  users: UserOption[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  editing: UserProfile | null;
  setEditing: (v: UserProfile | null) => void;
  onReload: () => void;
  addToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

// ── Component ──────────────────────────────────────────────────

const AssignmentsTab = ({
  assignments, structures, profiles, users, searchQuery, setSearchQuery,
  showModal, setShowModal, editing, setEditing, onReload, addToast
}: AssignmentsTabProps) => {
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();
  const [formUserId, setFormUserId] = useState<number | ''>('');
  const [formStructureId, setFormStructureId] = useState<number | ''>('');
  const [formProfileId, setFormProfileId] = useState<number | ''>('');
  const [formDateFrom, setFormDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [formDateTo, setFormDateTo] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormUserId('');
    setFormStructureId('');
    setFormProfileId('');
    setFormDateFrom(new Date().toISOString().split('T')[0]);
    setFormDateTo('');
    setFormStatus('ACTIVE');
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (a: UserProfile) => {
    setEditing(a);
    setFormUserId(a.userId);
    setFormStructureId(a.structureId);
    setFormProfileId(a.profileId || '');
    setFormDateFrom(a.dateFrom);
    setFormDateTo(a.dateTo || '');
    setFormStatus(a.status);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formUserId || !formStructureId || !formDateFrom) {
      addToast('Veuillez remplir les champs obligatoires', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/api/admin/tenancy/user-profiles/${editing.id}`, {
          dateFrom: formDateFrom,
          dateTo: formDateTo || null,
          status: formStatus,
          profileId: formProfileId || null,
        });
        addToast('Affectation mise a jour', 'success');
      } else {
        await apiClient.post('/api/admin/tenancy/user-profiles', {
          userId: formUserId,
          structureId: formStructureId,
          profileId: formProfileId || null,
          dateFrom: formDateFrom,
          dateTo: formDateTo || null,
        });
        addToast('Affectation creee', 'success');
      }
      setShowModal(false);
      resetForm();
      onReload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      const axiosMessage = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      addToast(axiosMessage || message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    const confirmed = await confirm('Desactiver cette affectation ?');
    if (!confirmed) return;
    try {
      await apiClient.delete(`/api/admin/tenancy/user-profiles/${id}`);
      addToast('Affectation desactivee', 'success');
      onReload();
    } catch {
      addToast('Erreur lors de la desactivation', 'error');
    }
  };

  const filtered = assignments.filter(a => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return a.username.toLowerCase().includes(q) ||
           a.userFullName?.toLowerCase().includes(q) ||
           a.structureCode.toLowerCase().includes(q) ||
           a.structureName.toLowerCase().includes(q);
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
            placeholder="Rechercher par utilisateur ou structure..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle affectation
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-surface-700 bg-slate-50 dark:bg-surface-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Structure</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Profil</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Periode</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-700">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{a.userFullName || a.username}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">@{a.username}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-900 dark:text-white">{a.structureName}</p>
                        <p className="text-xs text-slate-500">{a.structureCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {a.profileName ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400">
                        {a.profileName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {a.dateFrom}
                      {a.dateTo ? ` - ${a.dateTo}` : ' - permanent'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      a.status === 'ACTIVE'
                        ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-surface-700 dark:text-slate-400'
                    }`}>
                      {a.status === 'ACTIVE' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      {a.status === 'ACTIVE' && (
                        <button onClick={() => handleDeactivate(a.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                    {searchQuery ? 'Aucun resultat pour cette recherche' : 'Aucune affectation'}
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
          <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editing ? 'Modifier l\'affectation' : 'Nouvelle affectation'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-700">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* User select */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Utilisateur *</label>
                <select
                  value={formUserId}
                  onChange={(e) => setFormUserId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!!editing}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">Selectionner un utilisateur</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName || u.username} (@{u.username})</option>
                  ))}
                </select>
              </div>

              {/* Structure select */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Structure / Agence *</label>
                <select
                  value={formStructureId}
                  onChange={(e) => setFormStructureId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!!editing}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">Selectionner une structure</option>
                  {structures.filter(s => s.status === 'ACTIVE').map(s => (
                    <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                  ))}
                </select>
              </div>

              {/* Profile select */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Profil applicatif</label>
                <select
                  value={formProfileId}
                  onChange={(e) => setFormProfileId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                >
                  <option value="">Aucun profil</option>
                  {profiles.filter(p => p.status === 'ACTIVE').map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              {/* Date from */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date debut *</label>
                  <input
                    type="date"
                    value={formDateFrom}
                    onChange={(e) => setFormDateFrom(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date fin</label>
                  <input
                    type="date"
                    value={formDateTo}
                    onChange={(e) => setFormDateTo(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Status (only when editing) */}
              {editing && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Statut</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setShowModal(false); resetForm(); }}>Annuler</Button>
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

export default AssignmentsTab;

import { useState, useEffect } from 'react';
import {
  Shield, Plus, Edit, Search, X, Save,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import apiClient from '@/lib/apiClient';
import type { AppProfile } from './userAccessTypes';

// ── Props ──────────────────────────────────────────────────────

interface ProfilesTabProps {
  profiles: AppProfile[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  editing: AppProfile | null;
  setEditing: (v: AppProfile | null) => void;
  onReload: () => void;
  addToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

// ── Component ──────────────────────────────────────────────────

const ProfilesTab = ({
  profiles, searchQuery, setSearchQuery, showModal, setShowModal,
  editing, setEditing, onReload, addToast
}: ProfilesTabProps) => {
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [saving, setSaving] = useState(false);
  const [profileRoles, setProfileRoles] = useState<Record<number, string[]>>({});
  const [loadingRoles, setLoadingRoles] = useState<Record<number, boolean>>({});

  const loadRoles = async (profileId: number) => {
    if (profileRoles[profileId] !== undefined) return; // already loaded
    setLoadingRoles(prev => ({ ...prev, [profileId]: true }));
    try {
      const res = await apiClient.get(`/api/admin/tenancy/profiles/${profileId}/roles`);
      setProfileRoles(prev => ({ ...prev, [profileId]: res.data.data || [] }));
    } catch {
      setProfileRoles(prev => ({ ...prev, [profileId]: [] }));
    } finally {
      setLoadingRoles(prev => ({ ...prev, [profileId]: false }));
    }
  };

  // Load roles for all profiles on mount
  useEffect(() => {
    profiles.forEach(p => loadRoles(p.id));
  }, [profiles]);

  const resetForm = () => {
    setFormCode('');
    setFormName('');
    setFormDescription('');
    setFormStatus('ACTIVE');
    setEditing(null);
  };

  const openEdit = (p: AppProfile) => {
    setEditing(p);
    setFormCode(p.code);
    setFormName(p.name);
    setFormDescription(p.description || '');
    setFormStatus(p.status);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formCode || !formName) {
      addToast('Code et nom sont obligatoires', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/api/admin/tenancy/profiles/${editing.id}`, {
          name: formName,
          description: formDescription,
          status: formStatus,
        });
        addToast('Profil mis a jour', 'success');
      } else {
        await apiClient.post('/api/admin/tenancy/profiles', {
          code: formCode,
          name: formName,
          description: formDescription,
          status: formStatus,
        });
        addToast('Profil cree', 'success');
      }
      setShowModal(false);
      resetForm();
      onReload();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur';
      const axiosMessage = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      addToast(axiosMessage || message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = profiles.filter(p => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un profil..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau profil
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-surface-700 bg-slate-50 dark:bg-surface-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Roles (Keycloak)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-700">
              {filtered.map((p) => {
                const roles = profileRoles[p.id];
                const isLoading = loadingRoles[p.id];
                return (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-slate-900 dark:text-white">{p.code}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{p.name}</p>
                      {p.description && <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isLoading ? (
                      <span className="text-xs text-slate-400">Chargement...</span>
                    ) : roles && roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {roles.map((role: string) => (
                          <span
                            key={role}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            {role.replace('BDQM:ROLE_', '')}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Aucun role</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'ACTIVE'
                        ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-surface-700 dark:text-slate-400'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">Aucun profil</td>
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
          <div className="relative bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editing ? 'Modifier le profil' : 'Nouveau profil'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-700">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Code *</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  disabled={!!editing}
                  maxLength={50}
                  placeholder="ex: DATA_ENTRY"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
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

export default ProfilesTab;

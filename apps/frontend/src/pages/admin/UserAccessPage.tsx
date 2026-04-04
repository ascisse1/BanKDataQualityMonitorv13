import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Users, Shield, Plus, Edit, Trash2, Search, X, Save,
  Calendar, UserPlus, ChevronDown, Check, AlertCircle, RefreshCw
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toaster';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import apiClient from '@/lib/apiClient';
import { log } from '@/services/log';

// ── Types ───────────────────────────────────────────────────────

interface Structure {
  id: number;
  code: string;
  name: string;
  type: string;
  parentId: number | null;
  parentName: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AppProfile {
  id: number;
  code: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  id: number;
  dateFrom: string;
  dateTo: string | null;
  status: string;
  userId: number;
  username: string;
  userFullName: string;
  profileId: number | null;
  profileCode: string | null;
  profileName: string | null;
  structureId: number;
  structureCode: string;
  structureName: string;
  createdAt: string;
  updatedAt: string;
}

interface UserOption {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

type Tab = 'assignments' | 'structures' | 'profiles';

// ── Main Component ──────────────────────────────────────────────

const UserAccessPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('assignments');
  const [structures, setStructures] = useState<Structure[]>([]);
  const [profiles, setProfiles] = useState<AppProfile[]>([]);
  const [assignments, setAssignments] = useState<UserProfile[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<UserProfile | null>(null);
  const [editingStructure, setEditingStructure] = useState<Structure | null>(null);
  const [editingProfile, setEditingProfile] = useState<AppProfile | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [structRes, profileRes, assignRes, userRes] = await Promise.all([
        apiClient.get('/api/admin/tenancy/structures'),
        apiClient.get('/api/admin/tenancy/profiles'),
        apiClient.get('/api/admin/tenancy/user-profiles'),
        apiClient.get('/api/users'),
      ]);
      setStructures(structRes.data.data || []);
      setProfiles(profileRes.data.data || []);
      setAssignments(assignRes.data.data || []);
      // Users endpoint returns array wrapped in ApiResponse or direct array
      const userData = userRes.data.data || userRes.data || [];
      setUsers(Array.isArray(userData) ? userData.map((u: any) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName || u.full_name || '',
        email: u.email || '',
        role: u.role || '',
      })) : []);
    } catch (err) {
      log.error('api', 'Failed to load tenancy data', { error: err });
      addToast('Erreur lors du chargement des donnees', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<Record<string, number> | null>(null);

  const syncKeycloak = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await apiClient.post('/api/admin/tenancy/sync-keycloak');
      const result = res.data.data || {};
      setSyncResult(result);
      addToast(
        `Sync: ${result.linked || 0} lies, ${result.createdInKeycloak || 0} crees dans KC, ${result.importedFromKeycloak || 0} importes de KC, ${result.alreadySynced || 0} deja syncs`,
        'success'
      );
      loadAll();
    } catch (err) {
      log.error('auth', 'Keycloak sync failed', { error: err });
      addToast('Erreur lors de la synchronisation Keycloak', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // ── Stats ───────────────────────────────────────────────────

  const activeAssignments = assignments.filter(a => a.status === 'ACTIVE');
  const activeStructures = structures.filter(s => s.status === 'ACTIVE');
  const usersWithAccess = new Set(activeAssignments.map(a => a.userId)).size;

  const stats = [
    { label: 'Structures', value: activeStructures.length, icon: Building2, color: 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20' },
    { label: 'Profils', value: profiles.filter(p => p.status === 'ACTIVE').length, icon: Shield, color: 'text-accent-600 bg-accent-50 dark:text-accent-400 dark:bg-accent-900/20' },
    { label: 'Affectations actives', value: activeAssignments.length, icon: UserPlus, color: 'text-success-600 bg-success-50 dark:text-success-400 dark:bg-success-900/20' },
    { label: 'Utilisateurs avec acces', value: usersWithAccess, icon: Users, color: 'text-gold-600 bg-gold-50 dark:text-gold-400 dark:bg-gold-900/20' },
  ];

  // ── Tab components ─────────────────────────────────────────

  const tabs: { key: Tab; label: string; icon: typeof Building2 }[] = [
    { key: 'assignments', label: 'Affectations utilisateurs', icon: UserPlus },
    { key: 'structures', label: 'Structures / Agences', icon: Building2 },
    { key: 'profiles', label: 'Profils applicatifs', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Gestion des acces
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerez les structures, profils et affectations utilisateurs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={syncKeycloak} disabled={syncing}>
            <Shield className={`w-4 h-4 mr-2 ${syncing ? 'animate-pulse' : ''}`} />
            {syncing ? 'Synchronisation...' : 'Sync Keycloak'}
          </Button>
          <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
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
          {tabs.map((tab) => (
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
      {activeTab === 'assignments' && (
        <AssignmentsTab
          assignments={assignments}
          structures={structures}
          profiles={profiles}
          users={users}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showModal={showAssignModal}
          setShowModal={setShowAssignModal}
          editing={editingAssignment}
          setEditing={setEditingAssignment}
          onReload={loadAll}
          addToast={addToast}
        />
      )}
      {activeTab === 'structures' && (
        <StructuresTab
          structures={structures}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showModal={showStructureModal}
          setShowModal={setShowStructureModal}
          editing={editingStructure}
          setEditing={setEditingStructure}
          onReload={loadAll}
          addToast={addToast}
        />
      )}
      {activeTab === 'profiles' && (
        <ProfilesTab
          profiles={profiles}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showModal={showProfileModal}
          setShowModal={setShowProfileModal}
          editing={editingProfile}
          setEditing={setEditingProfile}
          onReload={loadAll}
          addToast={addToast}
        />
      )}
    </div>
  );
};

// ── Assignments Tab ─────────────────────────────────────────────

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
    <>
    <ConfirmDialogPortal />
    <div className="space-y-4">
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
    </>
  );
};

// ── Structures Tab ──────────────────────────────────────────────

interface StructuresTabProps {
  structures: Structure[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showModal: boolean;
  setShowModal: (v: boolean) => void;
  editing: Structure | null;
  setEditing: (v: Structure | null) => void;
  onReload: () => void;
  addToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const StructuresTab = ({
  structures, searchQuery, setSearchQuery, showModal, setShowModal,
  editing, setEditing, onReload, addToast
}: StructuresTabProps) => {
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('AGENCY');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormCode('');
    setFormName('');
    setFormType('AGENCY');
    setFormStatus('ACTIVE');
    setEditing(null);
  };

  const openEdit = (s: Structure) => {
    setEditing(s);
    setFormCode(s.code);
    setFormName(s.name);
    setFormType(s.type);
    setFormStatus(s.status);
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
        await apiClient.put(`/api/admin/tenancy/structures/${editing.id}`, {
          name: formName,
          type: formType,
          status: formStatus,
        });
        addToast('Structure mise a jour', 'success');
      } else {
        await apiClient.post('/api/admin/tenancy/structures', {
          code: formCode,
          name: formName,
          type: formType,
          status: formStatus,
        });
        addToast('Structure creee', 'success');
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

  const filtered = structures.filter(s => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une structure..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle structure
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-surface-700 bg-slate-50 dark:bg-surface-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-surface-700">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-slate-900 dark:text-white">{s.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 dark:bg-surface-700 dark:text-slate-400">
                      {s.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      s.status === 'ACTIVE'
                        ? 'bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-surface-700 dark:text-slate-400'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">Aucune structure</td>
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
                {editing ? 'Modifier la structure' : 'Nouvelle structure'}
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
                  onChange={(e) => setFormCode(e.target.value)}
                  disabled={!!editing}
                  maxLength={10}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="AGENCY">AGENCY</option>
                    <option value="REGION">REGION</option>
                    <option value="DEPARTMENT">DEPARTMENT</option>
                  </select>
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

// ── Profiles Tab ────────────────────────────────────────────────

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

export default UserAccessPage;

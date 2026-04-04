import { useState, useEffect } from 'react';
import { UserPlus, Shield, Building, RefreshCw } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';
import { useAuth } from '@/context/AuthContext';
import apiClient from '@/lib/apiClient';
import { log } from '@/services/log';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserStatsCards, UserTable, UserEditor, AgencyUserEditor } from './components';
import type { User, UserStats, Agency } from './components';

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    total: 0,
    active: 0,
    admins: 0,
    agency_users: 0,
    recent_logins: 0,
    agencies_with_users: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingAgencyUser, setIsCreatingAgencyUser] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();
  const { confirm, ConfirmDialogPortal } = useConfirmDialog();
  const [isSyncing, setIsSyncing] = useState(false);

  const hasAdminAccess = currentUser?.role === 'ADMIN';

  useEffect(() => {
    if (hasAdminAccess) {
      loadUsers();
      loadUserStats();
      loadAgencies();
    }
  }, [hasAdminAccess]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/users');
      setUsers(res.data.data || res.data || []);
    } catch (error) {
      log.error('api', 'Error loading users', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const res = await apiClient.get('/api/users/stats');
      setUserStats(res.data.data || res.data || {});
    } catch (error) {
      log.error('api', 'Error loading user stats', { error });
    }
  };

  const loadAgencies = async () => {
    try {
      const res = await apiClient.get('/api/structures');
      setAgencies(res.data);
    } catch (error) {
      log.error('api', 'Error loading agencies', { error });
    }
  };

  const syncFromKeycloak = async () => {
    setIsSyncing(true);
    try {
      const res = await apiClient.post('/api/users/sync-keycloak');
      const result = res.data.data || {};
      addToast(
        `Sync Keycloak: ${result.created || 0} crees, ${result.updated || 0} mis a jour, ${result.skipped || 0} ignores`,
        'success'
      );
      loadUsers();
      loadUserStats();
    } catch (error) {
      console.error('Keycloak sync error:', error);
      addToast('Erreur lors de la synchronisation Keycloak', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      const res = await apiClient.post('/api/users', userData);
      if (res.status >= 200 && res.status < 300) {
        setIsCreating(false);
        loadUsers();
        loadUserStats();
        addToast('Utilisateur cree avec succes', 'success');
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erreur lors de la creation';
      log.error('api', 'Create user error', { error });
      addToast(msg, 'error');
    }
  };

  const handleCreateAgencyUser = async (userData: Partial<User> & { structureName?: string }) => {
    try {
      const { structureName, ...userDataWithoutStructureName } = userData;
      const res = await apiClient.post('/api/agency-users', {
        ...userDataWithoutStructureName,
        structureName
      });
      if (res.status >= 200 && res.status < 300) {
        setIsCreatingAgencyUser(false);
        loadUsers();
        loadUserStats();
        addToast('Utilisateur d\'agence cree avec succes', 'success');
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erreur lors de la creation';
      addToast(msg, 'error');
    }
  };

  const handleUpdateUser = async (userData: User) => {
    try {
      const res = await apiClient.put(`/api/users/${userData.id}`, userData);
      if (res.status >= 200 && res.status < 300) {
        setEditingUser(null);
        loadUsers();
        addToast('Utilisateur mis a jour avec succes', 'success');
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erreur lors de la mise a jour';
      log.error('api', 'Update user error', { error });
      addToast(msg, 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      addToast('Vous ne pouvez pas supprimer votre propre compte', 'error');
      return;
    }

    const confirmed = await confirm('Etes-vous sur de vouloir supprimer cet utilisateur ?');
    if (!confirmed) return;
    try {
      const res = await apiClient.delete(`/api/users/${userId}`);
      if (res.status >= 200 && res.status < 300) {
        loadUsers();
        loadUserStats();
        addToast('Utilisateur supprime avec succes', 'success');
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erreur lors de la suppression';
      log.error('api', 'Delete user error', { error });
      addToast(msg, 'error');
    }
  };

  const handleBulkCreateAgencyUsers = async () => {
    try {
      if (!agencies || agencies.length === 0) {
        addToast('Aucune agence disponible', 'error');
        return;
      }

      const confirmed = await confirm(`Etes-vous sur de vouloir creer des utilisateurs pour ${agencies.length} agences ?`);
      if (!confirmed) return;

      const agenciesData = agencies.map(agency => ({
        structureCode: agency.code_agence,
        structureName: agency.lib_agence
      }));

      log.debug('api', 'Creating bulk agency users', { agenciesData });

      const res = await apiClient.post('/api/bulk-create-agency-users', {
        agencies: agenciesData
      });

      log.debug('api', 'Response status', { status: res.status });
      const data = res.data;
      log.debug('api', 'Response data', { data });

      loadUsers();
      loadUserStats();
      addToast(`${data.results.length} utilisateurs d'agence crees avec succes`, 'success');

      if (data.errors && data.errors.length > 0) {
        log.warning('api', 'Erreurs lors de la creation de certains utilisateurs', { errors: data.errors });
        addToast(`${data.errors.length} erreurs rencontrees. Voir la console pour plus de details.`, 'warning');
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Erreur lors de la creation des utilisateurs';
      log.error('api', 'Error creating bulk agency users', { error });
      addToast(msg, 'error');
    }
  };

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <Shield className="h-12 w-12 text-warning-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acces Restreint</h2>
          <p className="text-gray-600">
            Vous n'avez pas les permissions necessaires pour acceder a la gestion des utilisateurs.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ConfirmDialogPortal />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestion des utilisateurs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerer les comptes utilisateurs et les permissions d'acces ({userStats.total} utilisateurs)
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Button
            variant="outline"
            leftIcon={<Building className="h-4 w-4" />}
            onClick={handleBulkCreateAgencyUsers}
            disabled={isLoading}
          >
            Creer utilisateurs agence
          </Button>

          <Button
            variant="outline"
            leftIcon={<Building className="h-4 w-4" />}
            onClick={() => setIsCreatingAgencyUser(true)}
            disabled={isLoading}
          >
            Ajouter utilisateur agence
          </Button>

          <Button
            variant="primary"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setIsCreating(true)}
            disabled={isLoading}
          >
            Ajouter un utilisateur
          </Button>

          <Button
            variant="outline"
            leftIcon={<RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />}
            onClick={syncFromKeycloak}
            disabled={isSyncing}
          >
            {isSyncing ? 'Synchronisation...' : 'Sync Keycloak'}
          </Button>
        </div>
      </div>

      <UserStatsCards stats={userStats} />

      <UserTable
        users={users}
        isLoading={isLoading}
        currentUserId={currentUser?.id}
        onEditUser={setEditingUser}
        onDeleteUser={handleDeleteUser}
      />

      {(isCreating || editingUser) && (
        <UserEditor
          user={editingUser}
          agencies={agencies}
          onSave={editingUser ? handleUpdateUser : handleCreateUser}
          onCancel={() => {
            setIsCreating(false);
            setEditingUser(null);
          }}
        />
      )}

      {isCreatingAgencyUser && (
        <AgencyUserEditor
          agencies={agencies}
          onSave={handleCreateAgencyUser}
          onCancel={() => setIsCreatingAgencyUser(false)}
        />
      )}
    </div>
  );
};

export default UsersPage;

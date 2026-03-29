import { useState, useEffect } from 'react';
import { Users as UsersIcon, UserPlus, Mail, Shield, Calendar, Search, Edit, Trash2, Save, X, Building, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toaster';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../lib/apiClient';
import { log } from '../../services/log';


interface User {
  id: string | number;
  username: string;
  email: string;
  role: 'ADMIN' | 'AUDITOR' | 'USER' | 'AGENCY_USER';
  lastLogin: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  createdAt: string;
  fullName: string;
  department?: string;
  structureCodes?: string[];
}

interface UserStats {
  total: number;
  active: number;
  admins: number;
  agency_users: number;
  recent_logins: number;
  agencies_with_users: number;
}

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
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingAgencyUser, setIsCreatingAgencyUser] = useState(false);
  const [agencies, setAgencies] = useState<{code_agence: string, lib_agence: string}[]>([]);
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  // Vérifier les permissions
  const hasAdminAccess = currentUser?.role === 'ADMIN';

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
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${currentUser?.token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || data || []);
      }
    } catch (error) {
      log.error('api', 'Error loading users', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await fetch('/api/users/stats', {
        headers: {
          'Authorization': `Bearer ${currentUser?.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserStats(data.data || data || {});
      }
    } catch (error) {
      log.error('api', 'Error loading user stats', { error });
    }
  };

  const loadAgencies = async () => {
    try {
      const response = await fetch('/api/agencies');
      if (response.ok) {
        const data = await response.json();
        setAgencies(data);
      }
    } catch (error) {
      log.error('api', 'Error loading agencies', { error });
    }
  };

  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCreating(false);
        loadUsers();
        loadUserStats();
        addToast('Utilisateur créé avec succès', 'success');
      } else {
        addToast(data.error || 'Erreur lors de la création', 'error');
      }
    } catch (error) {
      log.error('api', 'Create user error', { error });
      addToast('Erreur lors de la création de l\'utilisateur', 'error');
    }
  };

  const handleCreateAgencyUser = async (userData: Partial<User> & { structureName?: string }) => {
    try {
            
      const { structureName, ...userDataWithoutStructureName } = userData;
      
      const response = await fetch('/api/agency-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`,
        },
        body: JSON.stringify({
          ...userDataWithoutStructureName,
          structureName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCreatingAgencyUser(false);
        loadUsers();
        loadUserStats();
        addToast('Utilisateur d\'agence créé avec succès', 'success');
      } else {
        addToast(data.error || 'Erreur lors de la création', 'error');
      }
    } catch (error) {
      addToast('Erreur lors de la création de l\'utilisateur d\'agence', 'error');
    }
  };

  const handleUpdateUser = async (userData: User) => {
    try {
      
      const response = await fetch(`/api/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setEditingUser(null);
        loadUsers();
        addToast('Utilisateur mis à jour avec succès', 'success');
      } else {
        addToast(data.error || 'Erreur lors de la mise à jour', 'error');
      }
    } catch (error) {
      log.error('api', 'Update user error', { error });
      addToast('Erreur lors de la mise à jour de l\'utilisateur', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      addToast('Vous ne pouvez pas supprimer votre propre compte', 'error');
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${currentUser?.token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          loadUsers();
          loadUserStats();
          addToast('Utilisateur supprimé avec succès', 'success');
        } else {
          addToast(data.error || 'Erreur lors de la suppression', 'error');
        }
      } catch (error) {
        log.error('api', 'Delete user error', { error });
        addToast('Erreur lors de la suppression de l\'utilisateur', 'error');
      }
    }
  };

  const handleBulkCreateAgencyUsers = async () => {
    try {
      if (!agencies || agencies.length === 0) {
        addToast('Aucune agence disponible', 'error');
        return;
      }
      
      if (!confirm(`Êtes-vous sûr de vouloir créer des utilisateurs pour ${agencies.length} agences ?`)) {
        return;
      }
      
            
      // Prepare the data to send
      const agenciesData = agencies.map(agency => ({
        structureCode: agency.code_agence,
        structureName: agency.lib_agence
      }));
      
      log.debug('api', 'Creating bulk agency users', { agenciesData });
      
      const response = await fetch('/api/bulk-create-agency-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token}`,
        },
        body: JSON.stringify({
          agencies: agenciesData
        }),
      });

      log.debug('api', 'Response status', { status: response.status });
      const data = await response.json();
      log.debug('api', 'Response data', { data });

      if (response.ok) {
        loadUsers();
        loadUserStats();
        addToast(`${data.results.length} utilisateurs d'agence créés avec succès`, 'success');
        
        if (data.errors && data.errors.length > 0) {
          log.warning('api', 'Erreurs lors de la creation de certains utilisateurs', { errors: data.errors });
          addToast(`${data.errors.length} erreurs rencontrées. Voir la console pour plus de détails.`, 'warning');
        }
      } else {
        addToast(data.error || 'Erreur lors de la création des utilisateurs', 'error');
      }
    } catch (error) {
      log.error('api', 'Error creating bulk agency users', { error });
      addToast('Erreur lors de la création des utilisateurs d\'agence', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-primary-100 text-primary-800';
      case 'AUDITOR':
        return 'bg-secondary-100 text-secondary-800';
      case 'AGENCY_USER':
        return 'bg-success-100 text-success-800';
      case 'USER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrateur';
      case 'AUDITOR':
        return 'Auditeur';
      case 'AGENCY_USER':
        return 'Utilisateur Agence';
      case 'USER':
        return 'Utilisateur';
      default:
        return role;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE'
      ? 'bg-success-100 text-success-800'
      : 'bg-error-100 text-error-800';
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.department?.toLowerCase().includes(query) ||
      user.structureCodes?.[0]?.toLowerCase().includes(query)
    );
  });

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <Shield className="h-12 w-12 text-warning-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès Restreint</h2>
          <p className="text-gray-600">
            Vous n'avez pas les permissions nécessaires pour accéder à la gestion des utilisateurs.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestion des utilisateurs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérer les comptes utilisateurs et les permissions d'accès ({userStats.total} utilisateurs)
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Button
            variant="outline"
            leftIcon={<Building className="h-4 w-4" />}
            onClick={handleBulkCreateAgencyUsers}
            disabled={isLoading}
          >
            Créer utilisateurs agence
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

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-full">
              <UsersIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">{userStats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-full">
              <Shield className="h-5 w-5 text-success-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Actifs</p>
              <p className="text-lg font-semibold text-gray-900">{userStats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-secondary-100 rounded-full">
              <Shield className="h-5 w-5 text-secondary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Administrateurs</p>
              <p className="text-lg font-semibold text-gray-900">{userStats.admins}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-full">
              <Building className="h-5 w-5 text-success-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Utilisateurs Agence</p>
              <p className="text-lg font-semibold text-gray-900">{userStats.agency_users || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-full">
              <Building className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Agences couvertes</p>
              <p className="text-lg font-semibold text-gray-900">{userStats.agencies_with_users || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-full">
              <Calendar className="h-5 w-5 text-warning-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Connectés 24h</p>
              <p className="text-lg font-semibold text-gray-900">{userStats.recent_logins}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card isLoading={isLoading}>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:w-64 mb-4 sm:mb-0">
              <Input
                placeholder="Rechercher des utilisateurs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4 text-gray-400" />}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 sm:-mx-6">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Département
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agence
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dernière connexion
                    </th>
                    <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <UsersIcon className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-lg font-medium">Aucun utilisateur trouvé</p>
                          <p className="text-sm">Ajustez vos critères de recherche</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {user.fullName && user.fullName.length > 0 ? user.fullName.charAt(0).toUpperCase() : '?'}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {user.email}
                              </div>
                              <div className="text-xs text-gray-400">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.department || 'Non défini'}</div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {user.structureCodes?.[0] ? (
                            <div className="flex items-center">
                              <Building className="h-4 w-4 text-gray-500 mr-1" />
                              <span className="text-sm text-gray-900">{user.structureCodes?.[0]}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                            {user.status === 'ACTIVE' ? 'Actif' : user.status === 'LOCKED' ? 'Verrouille' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(user.lastLogin)}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<Edit className="h-4 w-4" />}
                              onClick={() => setEditingUser(user)}
                            >
                              Modifier
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<Trash2 className="h-4 w-4" />}
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-error-600 hover:text-error-700"
                              >
                                Supprimer
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal de création/édition */}
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

      {/* Modal de création d'utilisateur d'agence */}
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

interface UserEditorProps {
  user: User | null;
  agencies: {code_agence: string, lib_agence: string}[];
  onSave: (user: any) => void;
  onCancel: () => void;
}

const UserEditor: React.FC<UserEditorProps> = ({ user, agencies, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    role: user?.role || 'USER',
    department: user?.department || '',
    status: user?.status || 'ACTIVE',
    structureCode: user?.structureCodes?.[0] || '',
    password: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Le nom complet est requis';
    }

    if (!user && !formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis pour un nouvel utilisateur';
    }

    if (formData.role === 'AGENCY_USER' && !formData.structureCode) {
      newErrors.structureCode = 'Le code agence est requis pour un utilisateur d\'agence';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const userData = user ? { ...user, ...formData } : formData;
      onSave(userData);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <Input
            label="Nom d'utilisateur"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            error={errors.username}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />

          <Input
            label="Nom complet"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            error={errors.fullName}
            required
          />

          <Input
            label="Département"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />

          {!user && (
            <Input
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              required
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            >
              <option value="USER">Utilisateur</option>
              <option value="AGENCY_USER">Utilisateur Agence</option>
              <option value="AUDITOR">Auditeur</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>

          {formData.role === 'AGENCY_USER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agence
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.structureCode}
                onChange={(e) => setFormData({ ...formData, structureCode: e.target.value })}
              >
                <option value="">Sélectionner une agence</option>
                {agencies.map(agency => (
                  <option key={agency.code_agence} value={agency.code_agence}>
                    {agency.code_agence} - {agency.lib_agence}
                  </option>
                ))}
              </select>
              {errors.structureCode && (
                <p className="mt-1 text-sm text-error-500">{errors.structureCode}</p>
              )}
            </div>
          )}

          {user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          )}
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
            {user ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface AgencyUserEditorProps {
  agencies: {code_agence: string, lib_agence: string}[];
  onSave: (user: any) => void;
  onCancel: () => void;
}

const AgencyUserEditor: React.FC<AgencyUserEditorProps> = ({ agencies, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    structureCode: '',
    structureName: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Le nom complet est requis';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    }

    if (!formData.structureCode) {
      newErrors.structureCode = 'Le code agence est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAgencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const structureCode = e.target.value;
    const selectedAgency = agencies.find(a => a.code_agence === structureCode);
    
    setFormData({
      ...formData,
      structureCode,
      structureName: selectedAgency?.lib_agence || '',
      username: structureCode ? `agency_${structureCode.toLowerCase()}` : '',
      email: structureCode ? `agence.${structureCode.toLowerCase()}@banque.ml` : '',
      fullName: selectedAgency ? `Utilisateur Agence ${selectedAgency.lib_agence}` : ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Nouvel utilisateur d'agence
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agence
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.structureCode}
              onChange={handleAgencyChange}
              required
            >
              <option value="">Sélectionner une agence</option>
              {agencies.map(agency => (
                <option key={agency.code_agence} value={agency.code_agence}>
                  {agency.code_agence} - {agency.lib_agence}
                </option>
              ))}
            </select>
            {errors.structureCode && (
              <p className="mt-1 text-sm text-error-500">{errors.structureCode}</p>
            )}
          </div>

          <Input
            label="Nom d'utilisateur"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            error={errors.username}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />

          <Input
            label="Nom complet"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            error={errors.fullName}
            required
          />

          <Input
            label="Mot de passe"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            required
          />
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
            Créer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
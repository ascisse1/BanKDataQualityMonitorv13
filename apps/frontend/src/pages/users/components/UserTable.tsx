import { useState } from 'react';
import { Users as UsersIcon, Mail, Shield, Calendar, Search, Edit, Trash2, Building } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatDate, getRoleColor, getRoleLabel, getStatusColor } from './helpers';
import type { User } from './types';

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  currentUserId: string | number | undefined;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, isLoading, currentUserId, onEditUser, onDeleteUser }) => {
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
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
                    Departement
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agence
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Derniere connexion
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
                        <p className="text-lg font-medium">Aucun utilisateur trouve</p>
                        <p className="text-sm">Ajustez vos criteres de recherche</p>
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
                        <div className="text-sm text-gray-900">{user.department || 'Non defini'}</div>
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
                            onClick={() => onEditUser(user)}
                          >
                            Modifier
                          </Button>
                          {user.id !== currentUserId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Trash2 className="h-4 w-4" />}
                              onClick={() => onDeleteUser(String(user.id))}
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
  );
};

export default UserTable;

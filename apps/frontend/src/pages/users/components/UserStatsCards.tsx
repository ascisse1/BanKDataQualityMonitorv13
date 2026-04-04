import { Users as UsersIcon, Shield, Calendar, Building } from 'lucide-react';
import Card from '@/components/ui/Card';
import type { UserStats } from './types';

interface UserStatsCardsProps {
  stats: UserStats;
}

const UserStatsCards: React.FC<UserStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      <Card className="p-4">
        <div className="flex items-center">
          <div className="p-2 bg-primary-100 rounded-full">
            <UsersIcon className="h-5 w-5 text-primary-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Total</p>
            <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
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
            <p className="text-lg font-semibold text-gray-900">{stats.active}</p>
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
            <p className="text-lg font-semibold text-gray-900">{stats.admins}</p>
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
            <p className="text-lg font-semibold text-gray-900">{stats.agency_users || 0}</p>
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
            <p className="text-lg font-semibold text-gray-900">{stats.agencies_with_users || 0}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center">
          <div className="p-2 bg-warning-100 rounded-full">
            <Calendar className="h-5 w-5 text-warning-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-500">Connectes 24h</p>
            <p className="text-lg font-semibold text-gray-900">{stats.recent_logins}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserStatsCards;

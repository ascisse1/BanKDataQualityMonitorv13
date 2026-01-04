import { Filter, X } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

interface ReconciliationFiltersProps {
  filters: {
    agency_code: string;
    client_id: string;
    status: string;
  };
  onFilterChange: (filters: any) => void;
  onReset: () => void;
}

export const ReconciliationFilters = ({
  filters,
  onFilterChange,
  onReset,
}: ReconciliationFiltersProps) => {
  const handleChange = (field: string, value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = filters.agency_code || filters.client_id || filters.status;

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
        </div>
        {hasActiveFilters && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
          >
            <X className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code agence
          </label>
          <Input
            type="text"
            placeholder="Ex: AG001"
            value={filters.agency_code}
            onChange={(e) => handleChange('agency_code', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID Client
          </label>
          <Input
            type="text"
            placeholder="Ex: CLI123456"
            value={filters.client_id}
            onChange={(e) => handleChange('client_id', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="reconciled">Réconcilié</option>
            <option value="partial">Partiel</option>
            <option value="failed">Échec</option>
          </select>
        </div>
      </div>
    </div>
  );
};

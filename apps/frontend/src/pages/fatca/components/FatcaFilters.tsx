import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Calendar, CheckSquare, XSquare, AlertTriangle, Clock, Shield } from 'lucide-react';

interface FatcaFiltersProps {
  isLoading?: boolean;
  onStatusChange?: (status: string | null) => void;
}

const STATUS_OPTIONS = [
  { value: 'PENDING_REVIEW', label: 'A verifier', icon: <AlertTriangle className="h-4 w-4" /> },
  { value: 'COMPLIANT', label: 'Conforme', icon: <CheckSquare className="h-4 w-4" /> },
  { value: 'NON_COMPLIANT', label: 'Non conforme', icon: <XSquare className="h-4 w-4" /> },
  { value: 'UNDER_INVESTIGATION', label: 'En investigation', icon: <Clock className="h-4 w-4" /> },
  { value: 'EXEMPT', label: 'Exempte', icon: <Shield className="h-4 w-4" /> },
];

const FatcaFilters = ({ isLoading = false, onStatusChange }: FatcaFiltersProps) => {
  const [selectedFilters, setSelectedFilters] = useState({
    status: '' as string,
    dateFrom: '',
    dateTo: '',
    country: '',
  });

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedFilters(prev => ({ ...prev, status: value }));
    onStatusChange?.(value || null);
  };

  const setStatus = (value: string) => {
    setSelectedFilters(prev => ({ ...prev, status: value }));
    onStatusChange?.(value || null);
  };

  const resetFilters = () => {
    setSelectedFilters({ status: '', dateFrom: '', dateTo: '', country: '' });
    onStatusChange?.(null);
  };

  const getStatusLabel = (value: string) => STATUS_OPTIONS.find(s => s.value === value)?.label || value;

  if (isLoading) {
    return <div className="animate-pulse"><div className="h-32 bg-gray-200 rounded" /></div>;
  }

  return (
    <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
      <div className="flex flex-wrap gap-6">
        <div className="min-w-80">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Statut FATCA</h4>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={selectedFilters.status}
            onChange={handleStatusChange}
          >
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="min-w-80">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Date d'entree en relation</h4>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input type="date" value={selectedFilters.dateFrom}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                placeholder="De" leftIcon={<Calendar className="h-4 w-4 text-gray-400" />} />
            </div>
            <div className="flex-1">
              <Input type="date" value={selectedFilters.dateTo}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                placeholder="A" leftIcon={<Calendar className="h-4 w-4 text-gray-400" />} />
            </div>
          </div>
        </div>

        <div className="min-w-80">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Pays</h4>
          <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={selectedFilters.country}
            onChange={(e) => setSelectedFilters(prev => ({ ...prev, country: e.target.value }))}>
            <option value="">Tous les pays</option>
            <option value="US">Etats-Unis</option>
            <option value="ML">Mali</option>
            <option value="FR">France</option>
            <option value="CA">Canada</option>
          </select>
        </div>
      </div>

      <div className="mt-4 border-t border-gray-200 pt-4 flex justify-between">
        <div className="text-sm">
          {selectedFilters.status || selectedFilters.dateFrom || selectedFilters.dateTo || selectedFilters.country ? (
            <span className="text-primary-600 font-medium">
              Filtres actifs: {[
                selectedFilters.status && `Statut: ${getStatusLabel(selectedFilters.status)}`,
                selectedFilters.dateFrom && `Date debut: ${selectedFilters.dateFrom}`,
                selectedFilters.dateTo && `Date fin: ${selectedFilters.dateTo}`,
                selectedFilters.country && `Pays: ${selectedFilters.country}`,
              ].filter(Boolean).join(', ')}
            </span>
          ) : (
            <span className="text-gray-500">Aucun filtre actif</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={resetFilters}
          disabled={!selectedFilters.status && !selectedFilters.dateFrom && !selectedFilters.dateTo && !selectedFilters.country}>
          Reinitialiser
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant={selectedFilters.status === '' ? 'primary' : 'outline'} size="sm"
          onClick={() => setStatus('')}>Tous</Button>
        {STATUS_OPTIONS.map(s => (
          <Button key={s.value}
            variant={selectedFilters.status === s.value ? 'primary' : 'outline'} size="sm"
            onClick={() => setStatus(s.value)} leftIcon={s.icon}>
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default FatcaFilters;

import { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Calendar, CheckSquare, XSquare, AlertTriangle, Clock } from 'lucide-react';

interface FatcaFiltersProps {
  isLoading?: boolean;
  onStatusChange?: (status: string | null) => void;
}

const FatcaFilters = ({ isLoading = false, onStatusChange }: FatcaFiltersProps) => {
  const [selectedFilters, setSelectedFilters] = useState({
    status: '' as string,
    dateFrom: '',
    dateTo: '',
    country: '',
    hasUsPhone: false
  });

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedFilters(prev => ({
      ...prev,
      status: value
    }));
    onStatusChange?.(value || null);
  };

  const resetFilters = () => {
    setSelectedFilters({
      status: '',
      dateFrom: '',
      dateTo: '',
      country: '',
      hasUsPhone: false
    });
    onStatusChange?.(null);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
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
            <option value="À vérifier">À vérifier</option>
            <option value="Confirmé">Confirmé</option>
            <option value="Exclu">Exclu</option>
            <option value="En attente">En attente</option>
          </select>
        </div>
        
        <div className="min-w-80">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Date d'entrée en relation</h4>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                type="date"
                value={selectedFilters.dateFrom}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                placeholder="De"
                leftIcon={<Calendar className="h-4 w-4 text-gray-400" />}
              />
            </div>
            <div className="flex-1">
              <Input
                type="date"
                value={selectedFilters.dateTo}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                placeholder="À"
                leftIcon={<Calendar className="h-4 w-4 text-gray-400" />}
              />
            </div>
          </div>
        </div>
        
        <div className="min-w-80">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Pays</h4>
          <select
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={selectedFilters.country}
            onChange={(e) => setSelectedFilters(prev => ({ ...prev, country: e.target.value }))}
          >
            <option value="">Tous les pays</option>
            <option value="US">États-Unis</option>
            <option value="ML">Mali</option>
            <option value="FR">France</option>
            <option value="CA">Canada</option>
          </select>
        </div>
      </div>
      
      <div className="mt-4 border-t border-gray-200 pt-4 flex justify-between">
        <div className="text-sm">
          {selectedFilters.status || selectedFilters.dateFrom || selectedFilters.dateTo || selectedFilters.country || selectedFilters.hasUsPhone ? (
            <span className="text-primary-600 font-medium">
              Filtres actifs: {[
                selectedFilters.status && `Statut: ${selectedFilters.status}`,
                selectedFilters.dateFrom && `Date début: ${selectedFilters.dateFrom}`,
                selectedFilters.dateTo && `Date fin: ${selectedFilters.dateTo}`,
                selectedFilters.country && `Pays: ${selectedFilters.country}`,
                selectedFilters.hasUsPhone && 'Téléphone US'
              ].filter(Boolean).join(', ')}
            </span>
          ) : (
            <span className="text-gray-500">Aucun filtre actif</span>
          )}
        </div>
        
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            disabled={!selectedFilters.status && !selectedFilters.dateFrom && !selectedFilters.dateTo && !selectedFilters.country && !selectedFilters.hasUsPhone}
          >
            Réinitialiser
          </Button>
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant={selectedFilters.status === '' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            setSelectedFilters(prev => ({ ...prev, status: '' }));
            onStatusChange?.(null);
          }}
        >
          Tous
        </Button>
        <Button
          variant={selectedFilters.status === 'À vérifier' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            setSelectedFilters(prev => ({ ...prev, status: 'À vérifier' }));
            onStatusChange?.('À vérifier');
          }}
          leftIcon={<AlertTriangle className="h-4 w-4" />}
        >
          À vérifier
        </Button>
        <Button
          variant={selectedFilters.status === 'Confirmé' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            setSelectedFilters(prev => ({ ...prev, status: 'Confirmé' }));
            onStatusChange?.('Confirmé');
          }}
          leftIcon={<CheckSquare className="h-4 w-4" />}
        >
          Confirmé
        </Button>
        <Button
          variant={selectedFilters.status === 'Exclu' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            setSelectedFilters(prev => ({ ...prev, status: 'Exclu' }));
            onStatusChange?.('Exclu');
          }}
          leftIcon={<XSquare className="h-4 w-4" />}
        >
          Exclu
        </Button>
        <Button
          variant={selectedFilters.status === 'En attente' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            setSelectedFilters(prev => ({ ...prev, status: 'En attente' }));
            onStatusChange?.('En attente');
          }}
          leftIcon={<Clock className="h-4 w-4" />}
        >
          En attente
        </Button>
      </div>
    </div>
  );
};

export default FatcaFilters;
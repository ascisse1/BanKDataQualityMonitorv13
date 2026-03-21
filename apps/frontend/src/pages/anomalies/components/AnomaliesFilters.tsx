import { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';

interface AnomaliesFiltersProps {
  isLoading?: boolean;
  onAgencyChange?: (agency: string | null) => void;
  onClientTypeChange?: (type: any) => void;
  onStatusChange?: (status: any) => void;
  agencies?: {code_agence: string, lib_agence: string}[];
  selectedAgency?: string | null;
  isAgencyUser?: boolean;
  userAgencyCode?: string | null;
}

const AnomaliesFilters = ({
  isLoading = false,
  onAgencyChange,
  agencies = [],
  selectedAgency,
  isAgencyUser = false,
  userAgencyCode = null
}: AnomaliesFiltersProps) => {
  const [, setSelectedFilters] = useState({
    clientType: [] as string[],
    fields: [] as string[],
    errorTypes: [] as string[],
    status: [] as string[]
  });

  useEffect(() => {
    // If user is an agency user, set their agency code as the selected agency
    if (isAgencyUser && userAgencyCode) {
      onAgencyChange?.(userAgencyCode);
    }
  }, [isAgencyUser, userAgencyCode, onAgencyChange]);

  const handleAgencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onAgencyChange?.(value || null);
  };

  const resetFilters = () => {
    // If user is an agency user, they can only reset to their agency
    if (isAgencyUser && userAgencyCode) {
      setSelectedFilters({
        clientType: [],
        fields: [],
        errorTypes: [],
        status: []
      });
      onAgencyChange?.(userAgencyCode);
    } else {
      setSelectedFilters({
        clientType: [],
        fields: [],
        errorTypes: [],
        status: []
      });
      onAgencyChange?.(null);
    }
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
          <h4 className="text-sm font-medium text-gray-700 mb-2">Agence</h4>
          {isLoading ? (
            <div className="w-full h-10 bg-gray-200 animate-pulse rounded-md"></div>
          ) : (
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={selectedAgency || ''}
              onChange={handleAgencyChange}
              disabled={isAgencyUser && userAgencyCode !== null}
            >
              <option value="">Toutes les agences</option>
              {agencies.map((agency) => (
                <option key={agency.code_agence} value={agency.code_agence}>
                  {agency.code_agence} - {agency.lib_agence}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      <div className="mt-4 border-t border-gray-200 pt-4 flex justify-between">
        <div className="text-sm">
          {selectedAgency ? (
            <span className="text-primary-600 font-medium">
              Agence sélectionnée: {selectedAgency} - {agencies.find(a => a.code_agence === selectedAgency)?.lib_agence}
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
            disabled={(!selectedAgency && !isAgencyUser) || (isAgencyUser && selectedAgency === userAgencyCode)}
          >
            Réinitialiser
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnomaliesFilters;
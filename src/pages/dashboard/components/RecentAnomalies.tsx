import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Anomaly {
  id: string;
  clientId: string;
  clientName: string;
  clientType: 'Individual' | 'Corporate';
  field: string;
  errorType: string;
  branch: string;
  createdAt: string;
  status: 'New' | 'Reviewing' | 'Resolved';
}

interface RecentAnomaliesProps {
  isLoading?: boolean;
}

const RecentAnomalies = ({ isLoading = false }: RecentAnomaliesProps) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  useEffect(() => {
    if (!isLoading) {
      // Utiliser des données fictives pour la démo
      const demoAnomalies: Anomaly[] = [
        {
          id: '1',
          clientId: 'CLI000123',
          clientName: 'OUEDRAOGO Moussa',
          clientType: 'Individual',
          field: 'Numéro d\'identité',
          errorType: 'Valeur manquante',
          branch: '01001',
          createdAt: new Date(new Date().getTime() - 30 * 60000).toISOString(),
          status: 'New'
        },
        {
          id: '2',
          clientId: 'CLI000456',
          clientName: 'KABORE Fatimata',
          clientType: 'Individual',
          field: 'Date de naissance',
          errorType: 'Format invalide',
          branch: '01002',
          createdAt: new Date(new Date().getTime() - 2 * 60 * 60000).toISOString(),
          status: 'Reviewing'
        },
        {
          id: '3',
          clientId: 'ENT000789',
          clientName: 'SOCIETE GENERALE DE COMMERCE',
          clientType: 'Corporate',
          field: 'Numéro de registre',
          errorType: 'Format invalide',
          branch: '01003',
          createdAt: new Date(new Date().getTime() - 4 * 60 * 60000).toISOString(),
          status: 'New'
        },
        {
          id: '4',
          clientId: 'CLI000321',
          clientName: 'TRAORE Oumar',
          clientType: 'Individual',
          field: 'Nationalité',
          errorType: 'Valeur manquante',
          branch: '01001',
          createdAt: new Date(new Date().getTime() - 6 * 60 * 60000).toISOString(),
          status: 'Resolved'
        },
        {
          id: '5',
          clientId: 'ENT000654',
          clientName: 'ENTREPRISE DE CONSTRUCTION BURKINA',
          clientType: 'Corporate',
          field: 'Date de création',
          errorType: 'Valeur manquante',
          branch: '01004',
          createdAt: new Date(new Date().getTime() - 8 * 60 * 60000).toISOString(),
          status: 'New'
        },
        {
          id: '6',
          clientId: 'CLI000987',
          clientName: 'DIALLO Aminata',
          clientType: 'Individual',
          field: 'Nom de la mère',
          errorType: 'Valeur manquante',
          branch: '01002',
          createdAt: new Date(new Date().getTime() - 10 * 60 * 60000).toISOString(),
          status: 'Reviewing'
        },
        {
          id: '7',
          clientId: 'ENT000852',
          clientName: 'COMPAGNIE MINIERE DU FASO',
          clientType: 'Corporate',
          field: 'Raison sociale',
          errorType: 'Format invalide',
          branch: '01003',
          createdAt: new Date(new Date().getTime() - 12 * 60 * 60000).toISOString(),
          status: 'New'
        }
      ];
      
      setAnomalies(demoAnomalies);
    }
  }, [isLoading]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-warning-100 text-warning-800';
      case 'Reviewing':
        return 'bg-primary-100 text-primary-800';
      case 'Resolved':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mb-4">
              <div className="h-24 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Client
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Field
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Error Type
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Branch
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Detected At
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {anomalies.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-lg font-medium">Aucune anomalie récente</p>
                  <p className="text-sm">Les anomalies détectées apparaîtront ici</p>
                </div>
              </td>
            </tr>
          ) : (
            anomalies.map((anomaly) => (
              <tr key={anomaly.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {anomaly.clientName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{anomaly.clientName}</div>
                      <div className="text-xs text-gray-500">{anomaly.clientId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{anomaly.field}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center">
                    <AlertTriangle className="h-4 w-4 text-warning-500 mr-1" />
                    {anomaly.errorType}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {anomaly.branch}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(anomaly.createdAt)}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      anomaly.status
                    )}`}
                  >
                    {anomaly.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RecentAnomalies;
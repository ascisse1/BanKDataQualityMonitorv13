import React, { useState, useEffect } from 'react';
import { Loader, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface DeploymentStatusProps {
  isDeploying?: boolean;
  deploymentError?: string | null;
  onRefresh?: () => void;
}

const DeploymentStatus: React.FC<DeploymentStatusProps> = ({ 
  isDeploying = false, 
  deploymentError = null,
  onRefresh
}) => {
  const [showStatus, setShowStatus] = useState(false);
  
  useEffect(() => {
    if (isDeploying || deploymentError) {
      setShowStatus(true);
    }
  }, [isDeploying, deploymentError]);
  
  if (!showStatus) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`p-4 rounded-lg shadow-lg ${
        deploymentError ? 'bg-error-50 border border-error-200' : 
        isDeploying ? 'bg-primary-50 border border-primary-200' : 
        'bg-success-50 border border-success-200'
      }`}>
        <div className="flex items-center">
          {isDeploying ? (
            <Loader className="h-5 w-5 text-primary-500 animate-spin mr-2" />
          ) : deploymentError ? (
            <AlertCircle className="h-5 w-5 text-error-500 mr-2" />
          ) : (
            <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
          )}
          
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              deploymentError ? 'text-error-800' : 
              isDeploying ? 'text-primary-800' : 
              'text-success-800'
            }`}>
              {deploymentError ? 'Erreur de déploiement' : 
               isDeploying ? 'Déploiement en cours...' : 
               'Déploiement réussi'}
            </p>
            {deploymentError && (
              <p className="text-xs text-error-600 mt-1">{deploymentError}</p>
            )}
          </div>
          
          {deploymentError && onRefresh && (
            <button 
              onClick={onRefresh}
              className="ml-2 p-1 rounded-full hover:bg-error-100"
            >
              <RefreshCw className="h-4 w-4 text-error-500" />
            </button>
          )}
          
          <button 
            onClick={() => setShowStatus(false)}
            className="ml-2 p-1 rounded-full hover:bg-gray-100"
          >
            <span className="sr-only">Fermer</span>
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeploymentStatus;
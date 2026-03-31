import React from 'react';
import { Settings } from 'lucide-react';
import Card from '../../components/ui/Card';
import { ValidationRulesManager } from '../../features/rules/components/ValidationRulesManager';
import { ErrorBoundary } from '../../features/rules/components/ErrorBoundary';
import ExportRulesButton from './components/ExportRulesButton';

const RulesPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Création Règles</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configurez et gérez les règles de validation pour les différents types de clients
            </p>
          </div>

          <div className="mt-4 sm:mt-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Exporter:</span>
              <ExportRulesButton />
            </div>
          </div>
        </div>

        <Card>
            <ValidationRulesManager />
        </Card>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoCard
            title="Date de Naissance"
            color="primary"
            items={[
              'Doit être supérieure à 1915',
              'Champ: bkcli.dna',
              'Sévérité: Haute'
            ]}
          />
          <InfoCard
            title="Date Expiration PI"
            color="secondary"
            items={[
              'En cours de validité',
              'Champ: bkcli.vid',
              'Sévérité: Critique'
            ]}
          />
          <InfoCard
            title="Numéro PI"
            color="success"
            items={[
              'Pas de caractères spéciaux',
              'Champ: bkcli.nid',
              'Sévérité: Haute'
            ]}
          />
          <InfoCard
            title="Nationalité"
            color="warning"
            items={[
              'Doit être renseignée',
              'Champ: bkcli.nat',
              'Sévérité: Moyenne'
            ]}
          />
        </div>

        {/* Database tables info */}
        <Card className="border-gray-200 bg-gray-50">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tables de la Base de Données</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'bkcli', description: 'Table principale des clients' },
                { name: 'bkcom', description: 'Table des comptes clients' },
                { name: 'bkadcli', description: 'Table des adresses clients' },
                { name: 'bkprfcli', description: 'Table des profils clients' },
                { name: 'bkcntcli', description: 'Table des contacts clients' },
                { name: 'bkemacli', description: 'Table des emails clients' },
              ].map((table) => (
                <div key={table.name} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                  <h4 className="font-medium text-gray-900 font-mono">{table.name}</h4>
                  <p className="text-sm text-gray-600">{table.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  );
};

// Info card component
interface InfoCardProps {
  title: string;
  color: 'primary' | 'secondary' | 'success' | 'warning';
  items: string[];
}

const InfoCard: React.FC<InfoCardProps> = ({ title, color, items }) => {
  const colorClasses = {
    primary: 'border-primary-200 bg-primary-50 text-primary-800',
    secondary: 'border-secondary-200 bg-secondary-50 text-secondary-800',
    success: 'border-success-200 bg-success-50 text-success-800',
    warning: 'border-warning-200 bg-warning-50 text-warning-800',
  };

  const headerClasses = {
    primary: 'text-primary-800',
    secondary: 'text-secondary-800',
    success: 'text-success-800',
    warning: 'text-warning-800',
  };

  const itemClasses = {
    primary: 'text-primary-700',
    secondary: 'text-secondary-700',
    success: 'text-success-700',
    warning: 'text-warning-700',
  };

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <div className="p-4">
        <h3 className={`text-lg font-medium mb-2 ${headerClasses[color]}`}>
          {title}
        </h3>
        <ul className={`text-sm space-y-1 ${itemClasses[color]}`}>
          {items.map((item, index) => (
            <li key={index}>• {item}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

export default RulesPage;

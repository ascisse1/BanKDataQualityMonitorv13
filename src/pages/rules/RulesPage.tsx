import React, { useState, useCallback } from 'react';
import { FileCode, Settings, TestTube, Database, Keyboard } from 'lucide-react';
import Card from '../../components/ui/Card';
import { ValidationRulesManager } from '../../features/rules/components/ValidationRulesManager';
import { ErrorBoundary } from '../../features/rules/components/ErrorBoundary';
import ValidationTester from './components/ValidationTester';
import SQLRulesEditor from './components/SQLRulesEditor';
import DatabaseRulesManager from './components/DatabaseRulesManager';
import { useNotification } from '../../context/NotificationContext';
import ExportRulesButton from './components/ExportRulesButton';
import ExportDatabaseRulesButton from './components/ExportDatabaseRulesButton';
import ExportSQLQueriesButton from './components/ExportSQLQueriesButton';

const DEFAULT_QUERIES = {
  individual_anomalies: `SELECT c.cli, c.nom, c.tcli, c.pre, c.nid, c.nmer, c.dna, e.email
FROM bkcli c
LEFT JOIN bkemacli e ON c.cli = e.cli
WHERE c.tcli = '1' AND (
  c.nid IS NULL OR c.nid = '' OR
  c.nmer IS NULL OR c.nmer = '' OR
  c.dna IS NULL OR
  e.email IS NULL OR e.email NOT LIKE '%@%.%'
)`,
  corporate_anomalies: `SELECT c.cli, c.nom, c.tcli, c.nrc, c.datc, e.email
FROM bkcli c
LEFT JOIN bkemacli e ON c.cli = e.cli
WHERE c.tcli <> '1' AND (
  c.nrc IS NULL OR c.nrc = '' OR
  c.datc IS NULL OR
  e.email IS NULL OR e.email NOT LIKE '%@%.%'
)`,
  institutional_anomalies: `SELECT c.cli, c.nom, c.tcli, c.nrc, c.datc, c.rso
FROM bkcli c
WHERE c.tcli = '3' AND (
  c.nrc IS NULL OR c.nrc = '' OR
  c.datc IS NULL OR
  c.rso IS NULL OR c.rso = ''
)`,
  anomalies_by_branch: `SELECT
  c.age as code_agence,
  COUNT(*) as nombre_anomalies
FROM bkcli c
LEFT JOIN bkemacli e ON c.cli = e.cli
WHERE
  (c.tcli = '1' AND (
    c.nid IS NULL OR c.nid = '' OR
    c.nmer IS NULL OR c.nmer = '' OR
    c.dna IS NULL OR
    e.email IS NULL OR e.email NOT LIKE '%@%.%'
  ))
  OR
  (c.tcli = '2' AND (
    c.nrc IS NULL OR c.nrc = '' OR
    c.datc IS NULL OR
    e.email IS NULL OR e.email NOT LIKE '%@%.%'
  ))
  OR
  (c.tcli = '3' AND (
    c.nrc IS NULL OR c.nrc = '' OR
    c.datc IS NULL OR
    c.rso IS NULL OR c.rso = ''
  ))
GROUP BY c.age
ORDER BY nombre_anomalies DESC`
};

const QUERY_DESCRIPTIONS = {
  individual_anomalies: 'Détecte les anomalies dans les dossiers des clients particuliers (tcli = 1)',
  corporate_anomalies: 'Détecte les anomalies dans les dossiers des entreprises (tcli = 2)',
  institutional_anomalies: 'Détecte les anomalies dans les dossiers des institutionnels (tcli = 3)',
  anomalies_by_branch: 'Compte le nombre d\'anomalies par agence pour tous les types de clients'
};

type TabId = 'rules' | 'database' | 'sql' | 'test';

interface Tab {
  id: TabId;
  name: string;
  icon: React.FC<{ className?: string }>;
  description: string;
  shortcut: string;
}

const tabs: Tab[] = [
  {
    id: 'rules',
    name: 'Règles de Validation',
    icon: Settings,
    description: 'Gérer les règles de contrôle par type de client',
    shortcut: '1'
  },
  {
    id: 'database',
    name: 'Règles Base de Données',
    icon: Database,
    description: 'Gérer les règles de contrôle pour les tables MySQL',
    shortcut: '2'
  },
  {
    id: 'sql',
    name: 'Requêtes SQL',
    icon: FileCode,
    description: 'Modifier les requêtes SQL de détection d\'anomalies',
    shortcut: '3'
  },
  {
    id: 'test',
    name: 'Testeur',
    icon: TestTube,
    description: 'Tester les règles avec des données d\'exemple',
    shortcut: '4'
  }
];

const RulesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('rules');
  const { showSuccess } = useNotification();
  const [databaseRules, setDatabaseRules] = useState<any[]>([]);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      showSuccess(`${tab.name} chargées`);
    }
  }, [showSuccess]);

  const handleDatabaseRulesUpdate = useCallback((rules: any[]) => {
    setDatabaseRules(rules);
  }, []);

  // Keyboard shortcuts for tabs
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Tab shortcuts (1-4)
      if (['1', '2', '3', '4'].includes(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tabIndex = parseInt(e.key) - 1;
        if (tabs[tabIndex]) {
          e.preventDefault();
          handleTabChange(tabs[tabIndex].id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleTabChange]);

  return (
    <ErrorBoundary>
      <div className="space-y-6 animate-fade-in">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Règles de Contrôle</h1>
            <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
              Configurez et gérez les règles de validation pour les différents types de clients
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                <Keyboard className="w-3 h-3" />
                Ctrl+K
              </span>
            </p>
          </div>

          {/* Export buttons */}
          <div className="mt-4 sm:mt-0">
            {activeTab === 'rules' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Exporter:</span>
                <ExportRulesButton />
              </div>
            )}
            {activeTab === 'database' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Exporter:</span>
                <ExportDatabaseRulesButton rules={databaseRules} />
              </div>
            )}
            {activeTab === 'sql' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Exporter:</span>
                <ExportSQLQueriesButton
                  queries={DEFAULT_QUERIES}
                  descriptions={QUERY_DESCRIPTIONS}
                />
              </div>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <Card>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-1 sm:space-x-4 overflow-x-auto" role="tablist">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`${tab.id}-panel`}
                    className={`
                      group relative flex items-center gap-2 whitespace-nowrap py-4 px-3
                      border-b-2 font-medium text-sm transition-all duration-200
                      ${isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    <span className="hidden sm:inline">{tab.name}</span>
                    <kbd className={`
                      hidden lg:inline-block ml-1 px-1.5 py-0.5 text-xs rounded
                      ${isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                      }
                    `}>
                      {tab.shortcut}
                    </kbd>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>

            {/* Tab panels */}
            <div role="tabpanel" id={`${activeTab}-panel`}>
              {activeTab === 'rules' && (
                <ValidationRulesManager onSwitchTab={handleTabChange} />
              )}
              {activeTab === 'database' && (
                <DatabaseRulesManager onRulesUpdate={handleDatabaseRulesUpdate} />
              )}
              {activeTab === 'sql' && <SQLRulesEditor />}
              {activeTab === 'test' && <ValidationTester />}
            </div>
          </div>
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

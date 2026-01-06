import { useState } from 'react';
import { FileCode, Settings, TestTube, Database, Download } from 'lucide-react';
import Card from '../../components/ui/Card';
import ValidationRulesManager from './components/ValidationRulesManager';
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

const RulesPage = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'database' | 'sql' | 'test'>('rules');
  const { showLoading, hideLoading, showSuccess } = useNotification();
  const [databaseRules, setDatabaseRules] = useState<any[]>([]);

  const tabs = [
    {
      id: 'rules',
      name: 'Règles de Validation',
      icon: Settings,
      description: 'Gérer les règles de contrôle par type de client'
    },
    {
      id: 'database',
      name: 'Règles Base de Données',
      icon: Database,
      description: 'Gérer les règles de contrôle pour les tables MySQL'
    },
    {
      id: 'sql',
      name: 'Requêtes SQL',
      icon: FileCode,
      description: 'Modifier les requêtes SQL de détection d\'anomalies'
    },
    {
      id: 'test',
      name: 'Testeur',
      icon: TestTube,
      description: 'Tester les règles avec des données d\'exemple'
    }
  ];

  const handleTabChange = (tabId: 'rules' | 'database' | 'sql' | 'test') => {
    showLoading(`Chargement des ${tabs.find(tab => tab.id === tabId)?.name}...`);
    
    // Simulate loading delay
    setTimeout(() => {
      setActiveTab(tabId);
      hideLoading();
      showSuccess(`${tabs.find(tab => tab.id === tabId)?.name} chargées avec succès`);
    }, 500);
  };

  const handleDatabaseRulesUpdate = (rules: any[]) => {
    setDatabaseRules(rules);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Règles de Contrôle</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configurez et gérez les règles de validation pour les différents types de clients et tables de données
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          {activeTab === 'rules' && (
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-500">Exporter:</span>
              <ExportRulesButton />
            </div>
          )}
          {activeTab === 'database' && (
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-500">Exporter:</span>
              <ExportDatabaseRulesButton rules={databaseRules} />
            </div>
          )}
          {activeTab === 'sql' && (
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-500">Exporter:</span>
              <ExportSQLQueriesButton 
                queries={DEFAULT_QUERIES} 
                descriptions={QUERY_DESCRIPTIONS}
              />
            </div>
          )}
        </div>
      </div>

      {/* Navigation par onglets */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'rules' && <ValidationRulesManager />}
          {activeTab === 'database' && <DatabaseRulesManager onRulesUpdate={handleDatabaseRulesUpdate} />}
          {activeTab === 'sql' && <SQLRulesEditor />}
          {activeTab === 'test' && <ValidationTester />}
        </div>
      </Card>

      {/* Informations sur les contrôles spécifiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-primary-200 bg-primary-50">
          <div className="p-4">
            <h3 className="text-lg font-medium text-primary-800 mb-2">
              Date de Naissance
            </h3>
            <ul className="text-sm text-primary-700 space-y-1">
              <li>• Doit être supérieure à 1915</li>
              <li>• Champ: bkcli.dna</li>
              <li>• Sévérité: Haute</li>
            </ul>
          </div>
        </Card>

        <Card className="border-secondary-200 bg-secondary-50">
          <div className="p-4">
            <h3 className="text-lg font-medium text-secondary-800 mb-2">
              Date Expiration PI
            </h3>
            <ul className="text-sm text-secondary-700 space-y-1">
              <li>• En cours de validité</li>
              <li>• Champ: bkcli.vid</li>
              <li>• Sévérité: Critique</li>
            </ul>
          </div>
        </Card>

        <Card className="border-success-200 bg-success-50">
          <div className="p-4">
            <h3 className="text-lg font-medium text-success-800 mb-2">
              Numéro PI
            </h3>
            <ul className="text-sm text-success-700 space-y-1">
              <li>• Pas de caractères spéciaux</li>
              <li>• Champ: bkcli.nid</li>
              <li>• Sévérité: Haute</li>
            </ul>
          </div>
        </Card>

        <Card className="border-warning-200 bg-warning-50">
          <div className="p-4">
            <h3 className="text-lg font-medium text-warning-800 mb-2">
              Nationalité
            </h3>
            <ul className="text-sm text-warning-700 space-y-1">
              <li>• Doit être renseignée</li>
              <li>• Champ: bkcli.nat</li>
              <li>• Sévérité: Moyenne</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Informations sur les tables */}
      <Card className="border-gray-200 bg-gray-50">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tables de la Base de Données</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900">bkcli</h4>
              <p className="text-sm text-gray-600">Table principale des clients</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900">bkcom</h4>
              <p className="text-sm text-gray-600">Table des comptes clients</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900">bkadcli</h4>
              <p className="text-sm text-gray-600">Table des adresses clients</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900">bkprfcli</h4>
              <p className="text-sm text-gray-600">Table des profils clients</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900">bkcntcli</h4>
              <p className="text-sm text-gray-600">Table des contacts clients</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900">bkemacli</h4>
              <p className="text-sm text-gray-600">Table des emails clients</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RulesPage;
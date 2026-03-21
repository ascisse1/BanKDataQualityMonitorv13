import { useState } from 'react';
import { Play, Save, FileCode, AlertTriangle, Download } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { db } from '../../../services/db';
import { useToast } from '../../../components/ui/Toaster';
import ExportSQLQueriesButton from './ExportSQLQueriesButton';

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

const SQLRulesEditor = () => {
  const [selectedQuery, setSelectedQuery] = useState('individual_anomalies');
  const [queryContent, setQueryContent] = useState(DEFAULT_QUERIES.individual_anomalies);
  const [isEditing, setIsEditing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const { addToast } = useToast();

  const handleQuerySelect = (queryName: keyof typeof DEFAULT_QUERIES) => {
    setSelectedQuery(queryName);
    setQueryContent(DEFAULT_QUERIES[queryName]);
    setIsEditing(false);
    setQueryResult(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    try {
      // Basic SQL validation
      if (!queryContent.trim().toLowerCase().startsWith('select')) {
        throw new Error('Seules les requêtes SELECT sont autorisées');
      }
      setIsEditing(false);
      addToast('Requête sauvegardée avec succès', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Requête invalide', 'error');
    }
  };

  const handleExecute = async () => {
    try {
      setIsExecuting(true);
      setQueryResult(null);

      const result = await db.executeQuery(queryContent);
      setQueryResult(result);
      addToast('Requête exécutée avec succès', 'success');
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Échec de l\'exécution de la requête',
        'error'
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const getQueryDescription = (queryName: string) => {
    switch (queryName) {
      case 'individual_anomalies':
        return 'Détecte les anomalies dans les dossiers des clients particuliers (tcli = 1)';
      case 'corporate_anomalies':
        return 'Détecte les anomalies dans les dossiers des entreprises (tcli = 2)';
      case 'institutional_anomalies':
        return 'Détecte les anomalies dans les dossiers des institutionnels (tcli = 3)';
      case 'anomalies_by_branch':
        return 'Compte le nombre d\'anomalies par agence pour tous les types de clients';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-x-2">
            <Button
              variant={selectedQuery === 'individual_anomalies' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleQuerySelect('individual_anomalies')}
            >
              Particuliers
            </Button>
            <Button
              variant={selectedQuery === 'corporate_anomalies' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleQuerySelect('corporate_anomalies')}
            >
              Entreprises
            </Button>
            <Button
              variant={selectedQuery === 'institutional_anomalies' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleQuerySelect('institutional_anomalies')}
            >
              Institutionnels
            </Button>
            <Button
              variant={selectedQuery === 'anomalies_by_branch' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleQuerySelect('anomalies_by_branch')}
            >
              Par Agence
            </Button>
          </div>

          <div className="space-x-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FileCode className="h-4 w-4" />}
                onClick={handleEdit}
              >
                Modifier
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Save className="h-4 w-4" />}
                onClick={handleSave}
              >
                Sauvegarder
              </Button>
            )}
            <Button
              variant="success"
              size="sm"
              leftIcon={<Play className="h-4 w-4" />}
              onClick={handleExecute}
              isLoading={isExecuting}
            >
              Exécuter
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            <strong>Requête sélectionnée :</strong> {getQueryDescription(selectedQuery)}
          </p>
        </div>

        <div className="relative">
          <textarea
            className="w-full h-64 font-mono text-sm p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={queryContent}
            onChange={(e) => setQueryContent(e.target.value)}
            readOnly={!isEditing}
            placeholder="Votre requête SQL ici..."
          />
          {!isEditing && (
            <div className="absolute inset-0 bg-gray-50 bg-opacity-50 cursor-not-allowed rounded-lg" />
          )}
        </div>

        {queryResult && (
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Résultats ({queryResult.length} enregistrements)
                </h3>
                <div className="text-sm text-gray-500">
                  Exécuté le {new Date().toLocaleString('fr-FR')}
                </div>
              </div>
              
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(queryResult[0] || {}).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {queryResult.slice(0, 100).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(row).map((value: any, j) => (
                          <td
                            key={j}
                            className="px-3 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {value?.toString() || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {queryResult.length > 100 && (
                <div className="text-sm text-gray-500 text-center py-2">
                  Affichage des 100 premiers résultats sur {queryResult.length} total
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="flex items-center space-x-2 text-sm text-warning-600 bg-warning-50 p-4 rounded-md">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <p>
            <strong>Attention :</strong> Les modifications des requêtes SQL peuvent affecter le fonctionnement de l'application.
            Assurez-vous de tester vos modifications avant de les appliquer en production.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SQLRulesEditor;
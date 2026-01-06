import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle, AlertTriangle, Save, Server } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { useToast } from './Toaster';
import { useNotification } from '../../context/NotificationContext';

interface DatabaseConfigPanelProps {
  onConfigChange?: (changed: boolean) => void;
}

const DatabaseConfigPanel: React.FC<DatabaseConfigPanelProps> = ({ onConfigChange }) => {
  const [dbType, setDbType] = useState<string>('demo');
  const [config, setConfig] = useState({
    host: 'localhost',
    port: '3306',
    database: 'bankdb',
    username: 'bankapp',
    password: 'password123',
    url: 'https://example.supabase.co',
    apiKey: 'demo-key',
    serviceRoleKey: ''
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
    data?: any;
    error?: any;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();
  const { showNotification } = useNotification();

  // Charger la configuration actuelle
  useEffect(() => {
    // Simuler le chargement de la configuration
    setTimeout(() => {
      testConnection();
    }, 500);
  }, []);

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      // En mode démo, on simule un test de connexion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = {
        success: true,
        message: 'Mode démo actif - Utilisation des données fictives',
        data: {
          mode: 'demo',
          recordCount: '325,037',
          timestamp: new Date().toISOString()
        }
      };
      
      setConnectionStatus(result);
      addToast('Mode démo actif - Utilisation des données fictives', 'success');
      onConfigChange?.(false);
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: 'Erreur lors du test de connexion',
        error: error instanceof Error ? error.message : String(error)
      });
      addToast('Erreur lors du test de connexion', 'error');
      onConfigChange?.(false);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    
    try {
      // En mode démo, on simule la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification('En mode démo, la configuration ne peut pas être modifiée', 'info');
      addToast('En mode démo, la configuration ne peut pas être modifiée', 'info');
      
      onConfigChange?.(true);
    } catch (error) {
      addToast('Erreur lors de la sauvegarde de la configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Database className="mr-2 h-5 w-5 text-primary-600" />
            Configuration de la Base de Données
          </h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={isTestingConnection ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              onClick={testConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? 'Test en cours...' : 'Tester la connexion'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save className="h-4 w-4" />}
              onClick={handleSaveConfig}
              disabled={isSaving || isTestingConnection}
            >
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de base de données
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={dbType}
              onChange={(e) => setDbType(e.target.value)}
              disabled={true}
            >
              <option value="demo">Mode Démo (données fictives)</option>
              <option value="supabase">Supabase</option>
              <option value="mysql">MySQL</option>
            </select>
            <p className="mt-1 text-xs text-warning-600">
              Le mode démo est activé. Pour changer de mode, modifiez le fichier .env
            </p>
          </div>

          {dbType === 'mysql' && (
            <div className="space-y-4 opacity-50">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Hôte"
                  value={config.host}
                  onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  disabled={true}
                />
                <Input
                  label="Port"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: e.target.value })}
                  disabled={true}
                />
              </div>
              <Input
                label="Base de données"
                value={config.database}
                onChange={(e) => setConfig({ ...config, database: e.target.value })}
                disabled={true}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Utilisateur"
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  disabled={true}
                />
                <Input
                  label="Mot de passe"
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  disabled={true}
                />
              </div>
            </div>
          )}

          {dbType === 'supabase' && (
            <div className="space-y-4 opacity-50">
              <Input
                label="URL Supabase"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="https://your-project-id.supabase.co"
                disabled={true}
              />
              <Input
                label="Clé Anonyme"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                disabled={true}
              />
              <Input
                label="Clé Service Role (optionnelle)"
                value={config.serviceRoleKey}
                onChange={(e) => setConfig({ ...config, serviceRoleKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                disabled={true}
              />
            </div>
          )}

          {dbType === 'demo' && (
            <div className="bg-primary-50 border border-primary-200 rounded-md p-4">
              <div className="flex items-start">
                <Server className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-primary-800 font-medium">
                    Mode démo actif - Utilisation des données fictives
                  </p>
                  <ul className="mt-2 text-sm text-primary-700 space-y-1">
                    <li>• Données générées automatiquement pour 325,037 clients</li>
                    <li>• Pas de connexion à une base de données réelle</li>
                    <li>• Idéal pour les démonstrations et les tests</li>
                    <li>• Toutes les fonctionnalités sont disponibles</li>
                  </ul>
                  <p className="mt-2 text-sm text-primary-700">
                    Pour passer en mode production, modifiez <code>DEMO_MODE=false</code> dans le fichier <code>.env</code> et configurez les paramètres de connexion.
                  </p>
                </div>
              </div>
            </div>
          )}

          {connectionStatus && (
            <div className={`mt-4 p-4 rounded-md ${connectionStatus.success ? 'bg-success-50 border border-success-200' : 'bg-error-50 border border-error-200'}`}>
              <div className="flex items-start">
                {connectionStatus.success ? (
                  <CheckCircle className="h-5 w-5 text-success-500 mt-0.5 mr-2 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${connectionStatus.success ? 'text-success-700' : 'text-error-700'}`}>
                    {connectionStatus.message}
                  </p>
                  {connectionStatus.data && (
                    <div className="mt-2 text-sm">
                      <p className="text-gray-600">Mode: <span className="font-medium">{connectionStatus.data.mode}</span></p>
                      <p className="text-gray-600">Enregistrements: <span className="font-medium">{connectionStatus.data.recordCount}</span></p>
                    </div>
                  )}
                  {connectionStatus.error && (
                    <p className="mt-2 text-sm text-error-600">
                      {typeof connectionStatus.error === 'string' ? connectionStatus.error : JSON.stringify(connectionStatus.error)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DatabaseConfigPanel;
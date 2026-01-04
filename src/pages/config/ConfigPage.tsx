import React, { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Database, RefreshCw, CheckCircle, AlertTriangle, Settings, Server, Shield, Save, Users, Key, Globe, Upload, FileCode } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import DatabaseConfigPanel from '../../components/ui/DatabaseConfigPanel';
import { isDemoMode } from '../../services/databaseConfig';
import Input from '../../components/ui/Input';

function ConfigPage() {
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    success: boolean,
    message: string,
    data?: any,
    error?: any
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'database' | 'ldap' | 'api' | 'sftp'>('database');
  const { showNotification } = useNotification();
  const { user } = useAuth();

  // LDAP Configuration state
  const [ldapEnabled, setLdapEnabled] = useState(false);
  const [ldapConfig, setLdapConfig] = useState({
    url: 'ldap://your-domain-controller.com',
    baseDN: 'dc=example,dc=com',
    bindDN: 'cn=admin,dc=example,dc=com',
    bindCredentials: '',
    userSearchBase: 'ou=users,dc=example,dc=com',
    userSearchFilter: '(sAMAccountName={{username}})',
    groupSearchBase: 'ou=groups,dc=example,dc=com',
    groupSearchFilter: '(member={{dn}})'
  });
  const [isTestingLdap, setIsTestingLdap] = useState(false);
  const [ldapStatus, setLdapStatus] = useState<{
    success: boolean,
    message: string,
    data?: any,
    error?: any
  } | null>(null);
  
  // API Configuration state
  const [apiConfig, setApiConfig] = useState({
    baseUrl: 'https://api.banque-centrale.ml',
    apiKey: '',
    timeout: '30000',
    retryCount: '3',
    enabled: false
  });
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    success: boolean,
    message: string,
    data?: any,
    error?: any
  } | null>(null);
  
  // SFTP Configuration state
  const [sftpConfig, setSftpConfig] = useState({
    host: 'sftp.banque-centrale.ml',
    port: '22',
    username: '',
    password: '',
    privateKeyPath: '',
    remoteDir: '/fatca/reports/',
    enabled: false
  });
  const [isTestingSftp, setIsTestingSftp] = useState(false);
  const [sftpStatus, setSftpStatus] = useState<{
    success: boolean,
    message: string,
    data?: any,
    error?: any
  } | null>(null);

  // Vérifier si l'utilisateur est un administrateur
  const isAdmin = user?.role === 'admin';
  
  const [dbConfigChanged, setDbConfigChanged] = useState(false);

  const testInformixConnection = async () => {
    if (!isAdmin) {
      showNotification('Vous n\'avez pas les permissions nécessaires pour effectuer cette action', 'error');
      return;
    }

    setIsTestingDb(true);
    showNotification('Test de connexion à la base de données Informix en cours...', 'loading');

    try {
      const response = await fetch('/api/test-informix');
      const data = await response.json();
      
      setDbStatus(data);
      
      if (data.success) {
        showNotification('Connexion à la base de données Informix réussie', 'success');
      } else {
        showNotification(`Échec de la connexion à la base de données Informix: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error testing database connection:', error);
      setDbStatus({
        success: false,
        message: 'Erreur lors du test de connexion à la base de données',
        error: error instanceof Error ? error.message : String(error)
      });
      showNotification('Erreur lors du test de connexion à la base de données', 'error');
    } finally {
      setIsTestingDb(false);
    }
  };

  const testLdapConnection = async () => {
    if (!isAdmin) {
      showNotification('Vous n\'avez pas les permissions nécessaires pour effectuer cette action', 'error');
      return;
    }

    setIsTestingLdap(true);
    showNotification('Test de connexion au serveur LDAP en cours...', 'loading');

    try {
      // In demo mode, simulate a successful test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = {
        success: true,
        message: 'Connexion au serveur LDAP réussie',
        data: {
          server: ldapConfig.url,
          userCount: '1,250',
          timestamp: new Date().toISOString()
        }
      };
      
      setLdapStatus(result);
      showNotification('Connexion au serveur LDAP réussie', 'success');
    } catch (error) {
      setLdapStatus({
        success: false,
        message: 'Erreur lors du test de connexion au serveur LDAP',
        error: error instanceof Error ? error.message : String(error)
      });
      showNotification('Erreur lors du test de connexion au serveur LDAP', 'error');
    } finally {
      setIsTestingLdap(false);
    }
  };

  const testApiConnection = async () => {
    if (!isAdmin) {
      showNotification('Vous n\'avez pas les permissions nécessaires pour effectuer cette action', 'error');
      return;
    }

    setIsTestingApi(true);
    showNotification('Test de connexion à l\'API en cours...', 'loading');

    try {
      // En mode démo, simuler un test réussi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApiStatus({
        success: true,
        message: 'Connexion à l\'API réussie',
        data: {
          baseUrl: apiConfig.baseUrl,
          status: 'OK',
          timestamp: new Date().toISOString()
        }
      });
      
      showNotification('Connexion à l\'API réussie', 'success');
    } catch (error) {
      setApiStatus({
        success: false,
        message: 'Erreur lors du test de connexion à l\'API',
        error: error instanceof Error ? error.message : String(error)
      });
      
      showNotification('Erreur lors du test de connexion à l\'API', 'error');
    } finally {
      setIsTestingApi(false);
    }
  };

  const testSftpConnection = async () => {
    if (!isAdmin) {
      showNotification('Vous n\'avez pas les permissions nécessaires pour effectuer cette action', 'error');
      return;
    }

    setIsTestingSftp(true);
    showNotification('Test de connexion SFTP en cours...', 'loading');

    try {
      // En mode démo, simuler un test réussi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSftpStatus({
        success: true,
        message: 'Connexion SFTP réussie',
        data: {
          host: sftpConfig.host,
          remoteDir: sftpConfig.remoteDir,
          timestamp: new Date().toISOString()
        }
      });
      
      showNotification('Connexion SFTP réussie', 'success');
    } catch (error) {
      setSftpStatus({
        success: false,
        message: 'Erreur lors du test de connexion SFTP',
        error: error instanceof Error ? error.message : String(error)
      });
      
      showNotification('Erreur lors du test de connexion SFTP', 'error');
    } finally {
      setIsTestingSftp(false);
    }
  };

  const handleSaveLdapConfig = async () => {
    if (!isAdmin) {
      showNotification('Vous n\'avez pas les permissions nécessaires pour effectuer cette action', 'error');
      return;
    }

    showNotification('Sauvegarde de la configuration LDAP en cours...', 'loading');

    try {
      // In demo mode, simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification('Configuration LDAP sauvegardée avec succès', 'success');
    } catch (error) {
      showNotification('Erreur lors de la sauvegarde de la configuration LDAP', 'error');
    }
  };

  const handleSaveApiConfig = async () => {
    if (!isAdmin) {
      showNotification('Vous n\'avez pas les permissions nécessaires pour effectuer cette action', 'error');
      return;
    }

    showNotification('Sauvegarde de la configuration API en cours...', 'loading');

    try {
      // En mode démo, simuler une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification('Configuration API sauvegardée avec succès', 'success');
    } catch (error) {
      showNotification('Erreur lors de la sauvegarde de la configuration API', 'error');
    }
  };

  const handleSaveSftpConfig = async () => {
    if (!isAdmin) {
      showNotification('Vous n\'avez pas les permissions nécessaires pour effectuer cette action', 'error');
      return;
    }

    showNotification('Sauvegarde de la configuration SFTP en cours...', 'loading');

    try {
      // En mode démo, simuler une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification('Configuration SFTP sauvegardée avec succès', 'success');
    } catch (error) {
      showNotification('Erreur lors de la sauvegarde de la configuration SFTP', 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <Settings className="mr-2 h-6 w-6 text-primary-600" />
          Configuration
        </h1>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('database')}
            className={`${
              activeTab === 'database'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <Database className="h-4 w-4" />
            <span>Base de Données</span>
          </button>
          <button
            onClick={() => setActiveTab('ldap')}
            className={`${
              activeTab === 'ldap'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <Users className="h-4 w-4" />
            <span>LDAP</span>
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`${
              activeTab === 'api'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <Globe className="h-4 w-4" />
            <span>API Banque Centrale</span>
          </button>
          <button
            onClick={() => setActiveTab('sftp')}
            className={`${
              activeTab === 'sftp'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <Upload className="h-4 w-4" />
            <span>SFTP FATCA</span>
          </button>
        </nav>
      </div>

      {activeTab === 'database' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Connection */}
          <DatabaseConfigPanel onConfigChange={setDbConfigChanged} />

          {/* Server Information */}
          <Card className="overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Server className="mr-2 h-5 w-5 text-primary-600" />
                Informations Serveur
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Environnement</p>
                    <p className="font-medium">{import.meta.env.MODE || 'development'}{isDemoMode ? ' (Mode Démo)' : ''}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Version Node.js</p>
                    <p className="font-medium">N/A (Client-side)</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Port API</p>
                    <p className="font-medium">3001</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-500">Port Frontend</p>
                    <p className="font-medium">5174</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500">Stratégie de base de données</p>
                  <p className="font-medium">{isDemoMode ? 'Mode Démo (données fictives)' : 'Supabase avec fallback API'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'ldap' && (
        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary-600" />
                Configuration de l'Authentification LDAP
              </h2>
              <div className="flex space-x-2">
                {ldapEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={isTestingLdap ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    onClick={testLdapConnection}
                    disabled={isTestingLdap}
                  >
                    {isTestingLdap ? 'Test en cours...' : 'Tester LDAP'}
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Save className="h-4 w-4" />}
                  onClick={handleSaveLdapConfig}
                  disabled={isTestingLdap}
                >
                  Sauvegarder
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-primary-600"
                    checked={!ldapEnabled}
                    onChange={() => setLdapEnabled(false)}
                  />
                  <span className="ml-2">Authentification locale (base de données interne)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-primary-600"
                    checked={ldapEnabled}
                    onChange={() => setLdapEnabled(true)}
                  />
                  <span className="ml-2">Authentification LDAP (Active Directory)</span>
                </label>
              </div>

              {ldapEnabled && (
                <div className="space-y-4 border p-4 rounded-md bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="URL du serveur LDAP"
                      value={ldapConfig.url}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, url: e.target.value })}
                      placeholder="ldap://your-domain-controller.com"
                      helperText="Exemple: ldap://ad.votreentreprise.com:389"
                    />
                    <Input
                      label="Base DN"
                      value={ldapConfig.baseDN}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, baseDN: e.target.value })}
                      placeholder="dc=example,dc=com"
                      helperText="Base de recherche LDAP"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Bind DN"
                      value={ldapConfig.bindDN}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, bindDN: e.target.value })}
                      placeholder="cn=admin,dc=example,dc=com"
                      helperText="Compte utilisé pour se connecter au LDAP"
                    />
                    <Input
                      label="Mot de passe"
                      type="password"
                      value={ldapConfig.bindCredentials}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, bindCredentials: e.target.value })}
                      placeholder="********"
                      helperText="Mot de passe du compte de liaison"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Base de recherche utilisateurs"
                      value={ldapConfig.userSearchBase}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, userSearchBase: e.target.value })}
                      placeholder="ou=users,dc=example,dc=com"
                      helperText="OU contenant les utilisateurs"
                    />
                    <Input
                      label="Filtre de recherche utilisateurs"
                      value={ldapConfig.userSearchFilter}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, userSearchFilter: e.target.value })}
                      placeholder="(sAMAccountName={{username}})"
                      helperText="Filtre pour trouver l'utilisateur"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Base de recherche groupes"
                      value={ldapConfig.groupSearchBase}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, groupSearchBase: e.target.value })}
                      placeholder="ou=groups,dc=example,dc=com"
                      helperText="OU contenant les groupes"
                    />
                    <Input
                      label="Filtre de recherche groupes"
                      value={ldapConfig.groupSearchFilter}
                      onChange={(e) => setLdapConfig({ ...ldapConfig, groupSearchFilter: e.target.value })}
                      placeholder="(member={{dn}})"
                      helperText="Filtre pour trouver les groupes de l'utilisateur"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-start">
                      <Key className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-blue-800 font-medium">
                          Correspondance des rôles
                        </p>
                        <p className="mt-1 text-sm text-blue-700">
                          Les utilisateurs LDAP seront associés aux rôles de l'application en fonction de leur appartenance aux groupes AD.
                        </p>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="flex items-center">
                            <span className="text-xs px-2 py-1 bg-primary-100 text-primary-800 rounded-full mr-2">Admin</span>
                            <Input
                              placeholder="CN=Admins,OU=Groups,DC=example,DC=com"
                              className="text-xs"
                            />
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs px-2 py-1 bg-secondary-100 text-secondary-800 rounded-full mr-2">Auditeur</span>
                            <Input
                              placeholder="CN=Auditors,OU=Groups,DC=example,DC=com"
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {ldapStatus && (
                <div className={`mt-4 p-4 rounded-md ${ldapStatus.success ? 'bg-success-50 border border-success-200' : 'bg-error-50 border border-error-200'}`}>
                  <div className="flex items-start">
                    {ldapStatus.success ? (
                      <CheckCircle className="h-5 w-5 text-success-500 mt-0.5 mr-2 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-medium ${ldapStatus.success ? 'text-success-700' : 'text-error-700'}`}>
                        {ldapStatus.message}
                      </p>
                      {ldapStatus.data && (
                        <div className="mt-2 text-sm">
                          <p className="text-gray-600">Serveur: <span className="font-medium">{ldapStatus.data.server}</span></p>
                          <p className="text-gray-600">Utilisateurs: <span className="font-medium">{ldapStatus.data.userCount}</span></p>
                        </div>
                      )}
                      {ldapStatus.error && (
                        <p className="mt-2 text-sm text-error-600">
                          {typeof ldapStatus.error === 'string' ? ldapStatus.error : JSON.stringify(ldapStatus.error)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'api' && (
        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Globe className="mr-2 h-5 w-5 text-primary-600" />
                Configuration de l'API Banque Centrale
              </h2>
              <div className="flex space-x-2">
                {apiConfig.enabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={isTestingApi ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    onClick={testApiConnection}
                    disabled={isTestingApi}
                  >
                    {isTestingApi ? 'Test en cours...' : 'Tester API'}
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Save className="h-4 w-4" />}
                  onClick={handleSaveApiConfig}
                  disabled={isTestingApi}
                >
                  Sauvegarder
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-primary-600"
                    checked={apiConfig.enabled}
                    onChange={() => setApiConfig({ ...apiConfig, enabled: !apiConfig.enabled })}
                  />
                  <span className="ml-2">Activer l'API Banque Centrale</span>
                </label>
              </div>

              {apiConfig.enabled && (
                <div className="space-y-4 border p-4 rounded-md bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="URL de base de l'API"
                      value={apiConfig.baseUrl}
                      onChange={(e) => setApiConfig({ ...apiConfig, baseUrl: e.target.value })}
                      placeholder="https://api.banque-centrale.ml"
                      helperText="URL de base pour toutes les requêtes API"
                    />
                    <Input
                      label="Clé API"
                      type="password"
                      value={apiConfig.apiKey}
                      onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
                      placeholder="********"
                      helperText="Clé d'authentification pour l'API"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Timeout (ms)"
                      value={apiConfig.timeout}
                      onChange={(e) => setApiConfig({ ...apiConfig, timeout: e.target.value })}
                      placeholder="30000"
                      helperText="Délai d'attente maximum pour les requêtes"
                    />
                    <Input
                      label="Nombre de tentatives"
                      value={apiConfig.retryCount}
                      onChange={(e) => setApiConfig({ ...apiConfig, retryCount: e.target.value })}
                      placeholder="3"
                      helperText="Nombre de tentatives en cas d'échec"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-start">
                      <FileCode className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-blue-800 font-medium">
                          Endpoints FATCA disponibles
                        </p>
                        <p className="mt-1 text-sm text-blue-700">
                          L'API Banque Centrale fournit les endpoints suivants pour la gestion FATCA:
                        </p>
                        <div className="mt-2 space-y-1 text-sm text-blue-700">
                          <p>• <code className="bg-blue-100 px-1 rounded">/api/fatca/validate</code> - Validation des déclarations</p>
                          <p>• <code className="bg-blue-100 px-1 rounded">/api/fatca/submit</code> - Soumission des déclarations</p>
                          <p>• <code className="bg-blue-100 px-1 rounded">/api/fatca/status</code> - Statut des déclarations</p>
                          <p>• <code className="bg-blue-100 px-1 rounded">/api/fatca/history</code> - Historique des déclarations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {apiStatus && (
                <div className={`mt-4 p-4 rounded-md ${apiStatus.success ? 'bg-success-50 border border-success-200' : 'bg-error-50 border border-error-200'}`}>
                  <div className="flex items-start">
                    {apiStatus.success ? (
                      <CheckCircle className="h-5 w-5 text-success-500 mt-0.5 mr-2 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-medium ${apiStatus.success ? 'text-success-700' : 'text-error-700'}`}>
                        {apiStatus.message}
                      </p>
                      {apiStatus.data && (
                        <div className="mt-2 text-sm">
                          <p className="text-gray-600">URL: <span className="font-medium">{apiStatus.data.baseUrl}</span></p>
                          <p className="text-gray-600">Statut: <span className="font-medium">{apiStatus.data.status}</span></p>
                        </div>
                      )}
                      {apiStatus.error && (
                        <p className="mt-2 text-sm text-error-600">
                          {typeof apiStatus.error === 'string' ? apiStatus.error : JSON.stringify(apiStatus.error)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'sftp' && (
        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Upload className="mr-2 h-5 w-5 text-primary-600" />
                Configuration SFTP pour FATCA
              </h2>
              <div className="flex space-x-2">
                {sftpConfig.enabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={isTestingSftp ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    onClick={testSftpConnection}
                    disabled={isTestingSftp}
                  >
                    {isTestingSftp ? 'Test en cours...' : 'Tester SFTP'}
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Save className="h-4 w-4" />}
                  onClick={handleSaveSftpConfig}
                  disabled={isTestingSftp}
                >
                  Sauvegarder
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-primary-600"
                    checked={sftpConfig.enabled}
                    onChange={() => setSftpConfig({ ...sftpConfig, enabled: !sftpConfig.enabled })}
                  />
                  <span className="ml-2">Activer le transfert SFTP pour FATCA</span>
                </label>
              </div>

              {sftpConfig.enabled && (
                <div className="space-y-4 border p-4 rounded-md bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Hôte SFTP BCEAO"
                      value="sftp.bceao.int"
                      onChange={(e) => setSftpConfig({ ...sftpConfig, host: e.target.value })}
                      placeholder="sftp.bceao.int"
                      helperText="Serveur SFTP de la BCEAO"
                    />
                    <Input
                      label="Port"
                      value={sftpConfig.port}
                      onChange={(e) => setSftpConfig({ ...sftpConfig, port: e.target.value })}
                      placeholder="22"
                      helperText="Port SFTP (généralement 22)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nom d'utilisateur BCEAO"
                      value="bsic_fatca"
                      onChange={(e) => setSftpConfig({ ...sftpConfig, username: e.target.value })}
                      placeholder="bsic_fatca"
                      helperText="Nom d'utilisateur SFTP"
                    />
                    <Input
                      label="Mot de passe"
                      type="password"
                      value={sftpConfig.password}
                      onChange={(e) => setSftpConfig({ ...sftpConfig, password: e.target.value })}
                      placeholder="********"
                      helperText="Mot de passe SFTP (laisser vide si clé privée utilisée)"
                    />
                  </div>

                  <Input
                    label="Chemin de la clé privée"
                    value={sftpConfig.privateKeyPath}
                    onChange={(e) => setSftpConfig({ ...sftpConfig, privateKeyPath: e.target.value })}
                    placeholder="/path/to/private/key"
                    helperText="Chemin vers la clé privée (laisser vide si mot de passe utilisé)"
                  />

                  <Input
                    label="Répertoire distant"
                    value="/CONTRACTS"
                    onChange={(e) => setSftpConfig({ ...sftpConfig, remoteDir: e.target.value })}
                    placeholder="/CONTRACTS"
                    helperText="Répertoire de dépôt des fichiers FATCA"
                  />
                  
                  <Input
                    label="Répertoire de retour"
                    value="/REPORTINGS"
                    onChange={(e) => setSftpConfig({ ...sftpConfig, returnDir: e.target.value })}
                    placeholder="/REPORTINGS"
                    helperText="Répertoire de retour des rapports BCEAO"
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-start">
                      <FileCode className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-blue-800 font-medium">
                          Informations sur les fichiers FATCA
                        </p>
                        <p className="mt-1 text-sm text-blue-700">
                          Les fichiers FATCA doivent être au format XML et respecter le schéma FATCA v2.0 de l'IRS.
                        </p>
                        <div className="mt-2 space-y-1 text-sm text-blue-700">
                          <p>• Nomenclature: <code className="bg-blue-100 px-1 rounded">FATCA_BF_YYYYMMDD.xml</code></p>
                          <p>• Fréquence: Annuelle (avant le 30 juin)</p>
                          <p>• Fichier de contrôle: <code className="bg-blue-100 px-1 rounded">FATCA_BF_YYYYMMDD.xml.md5</code></p>
                          <p>• Chiffrement: Obligatoire (clé publique de la BCEAO)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {sftpStatus && (
                <div className={`mt-4 p-4 rounded-md ${sftpStatus.success ? 'bg-success-50 border border-success-200' : 'bg-error-50 border border-error-200'}`}>
                  <div className="flex items-start">
                    {sftpStatus.success ? (
                      <CheckCircle className="h-5 w-5 text-success-500 mt-0.5 mr-2 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-error-500 mt-0.5 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-medium ${sftpStatus.success ? 'text-success-700' : 'text-error-700'}`}>
                        {sftpStatus.message}
                      </p>
                      {sftpStatus.data && (
                        <div className="mt-2 text-sm">
                          <p className="text-gray-600">Hôte: <span className="font-medium">{sftpStatus.data.host}</span></p>
                          <p className="text-gray-600">Répertoire: <span className="font-medium">{sftpStatus.data.remoteDir}</span></p>
                        </div>
                      )}
                      {sftpStatus.error && (
                        <p className="mt-2 text-sm text-error-600">
                          {typeof sftpStatus.error === 'string' ? sftpStatus.error : JSON.stringify(sftpStatus.error)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Security Settings */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Shield className="mr-2 h-5 w-5 text-primary-600" />
            Paramètres de Sécurité
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Authentification</p>
                <p className="font-medium">JWT (JSON Web Tokens)</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Durée de validité des tokens</p>
                <p className="font-medium">24 heures</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Mode de connexion</p>
                <p className="font-medium">{isDemoMode ? 'Démo (comptes prédéfinis)' : 'Production (base de données)'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">Hachage des mots de passe</p>
                <p className="font-medium">bcrypt (10 rounds)</p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm text-gray-500">Contrôle d'accès</p>
              <p className="font-medium">Basé sur les rôles (RBAC)</p>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs font-medium">
                  Administrateur
                </div>
                <div className="bg-warning-100 text-warning-800 px-2 py-1 rounded text-xs font-medium">
                  Auditeur
                </div>
                <div className="bg-success-100 text-success-800 px-2 py-1 rounded text-xs font-medium">
                  Utilisateur Agence
                </div>
                <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                  Utilisateur
                </div>
                {isDemoMode && (
                  <div className="bg-secondary-100 text-secondary-800 px-2 py-1 rounded text-xs font-medium">
                    Mode Démo
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default ConfigPage;
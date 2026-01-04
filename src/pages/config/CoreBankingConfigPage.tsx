import React, { useState, useEffect } from 'react';
import { Database, Plus, Edit2, Trash2, TestTube, Check, X, Eye, EyeOff, Save, RefreshCw } from 'lucide-react';
import { coreBankingConfigService, CoreBankingConfig, ConnectionTestResult } from '../../services/coreBankingConfigService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import JdbcDriverManager from '../../components/ui/JdbcDriverManager';

const CoreBankingConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<CoreBankingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CoreBankingConfig | null>(null);
  const [testResults, setTestResults] = useState<Record<string, ConnectionTestResult>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testingForm, setTestingForm] = useState(false);

  const [formData, setFormData] = useState<Partial<CoreBankingConfig>>({
    configName: '',
    dbType: 'informix',
    jdbcDriver: 'com.informix.jdbc.IfxDriver',
    jdbcUrl: '',
    host: 'localhost',
    port: 9088,
    databaseName: 'lcb',
    username: 'bank',
    password: '',
    additionalParams: { INFORMIXSERVER: 'ol_informix1210' },
    isActive: true,
    isDefault: false,
    connectionPoolSize: 10,
    connectionTimeout: 30,
    testQuery: 'SELECT 1 FROM systables WHERE tabid = 1'
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await coreBankingConfigService.getAllConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDbTypeChange = (dbType: string) => {
    const driver = coreBankingConfigService.getDefaultDriver(dbType);
    const port = coreBankingConfigService.getDefaultPort(dbType);
    const testQuery = coreBankingConfigService.getDefaultTestQuery(dbType);

    setFormData({
      ...formData,
      dbType: dbType as any,
      jdbcDriver: driver,
      port,
      testQuery
    });
  };

  const handleGenerateJdbcUrl = () => {
    const url = coreBankingConfigService.buildJdbcUrl(formData);
    setFormData({ ...formData, jdbcUrl: url });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingConfig?.id) {
        await coreBankingConfigService.updateConfig(editingConfig.id, formData);
      } else {
        await coreBankingConfigService.createConfig(formData as CoreBankingConfig);
      }
      await loadConfigs();
      resetForm();
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Échec de l\'enregistrement de la configuration');
    }
  };

  const handleEdit = (config: CoreBankingConfig) => {
    setEditingConfig(config);
    setFormData(config);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) return;

    try {
      await coreBankingConfigService.deleteConfig(id);
      await loadConfigs();
    } catch (error) {
      console.error('Failed to delete config:', error);
      alert('Échec de la suppression de la configuration');
    }
  };

  const handleTestConnection = async (config: CoreBankingConfig) => {
    try {
      setTesting(config.id!);
      setTestResults({ ...testResults, [config.id!]: { success: false, message: 'Test en cours...' } });
      const result = await coreBankingConfigService.testConnection(config);
      setTestResults({ ...testResults, [config.id!]: result });
      await loadConfigs();
    } catch (error: any) {
      setTestResults({
        ...testResults,
        [config.id!]: { success: false, message: 'Erreur', error: error.message }
      });
    } finally {
      setTesting(null);
    }
  };

  const handleTestFormConnection = async () => {
    try {
      setTestingForm(true);
      const testConfig = {
        ...formData,
        id: 'test-form'
      } as CoreBankingConfig;
      const result = await coreBankingConfigService.testConnection(testConfig);
      setTestResults({ ...testResults, 'test-form': result });
    } catch (error: any) {
      setTestResults({
        ...testResults,
        'test-form': { success: false, message: 'Erreur', error: error.message }
      });
    } finally {
      setTestingForm(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await coreBankingConfigService.setDefaultConfig(id);
      await loadConfigs();
    } catch (error) {
      console.error('Failed to set default config:', error);
      alert('Échec de la définition de la configuration par défaut');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingConfig(null);
    setFormData({
      configName: '',
      dbType: 'informix',
      jdbcDriver: 'com.informix.jdbc.IfxDriver',
      jdbcUrl: '',
      host: 'localhost',
      port: 9088,
      databaseName: 'lcb',
      username: 'bank',
      password: '',
      additionalParams: { INFORMIXSERVER: 'ol_informix1210' },
      isActive: true,
      isDefault: false,
      connectionPoolSize: 10,
      connectionTimeout: 30,
      testQuery: 'SELECT 1 FROM systables WHERE tabid = 1'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuration CoreBanking</h1>
            <p className="text-sm text-gray-600">Gérer les connexions JDBC aux bases de données CoreBanking</p>
          </div>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setShowForm(true)}
        >
          Nouvelle configuration
        </Button>
      </div>

      <JdbcDriverManager />

      {showForm && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingConfig ? 'Modifier la configuration' : 'Nouvelle configuration'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Nom de la configuration"
                    value={formData.configName}
                    onChange={(e) => setFormData({ ...formData, configName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de base de données</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.dbType}
                    onChange={(e) => handleDbTypeChange(e.target.value)}
                    required
                  >
                    <option value="informix">Informix</option>
                    <option value="oracle">Oracle</option>
                    <option value="mysql">MySQL</option>
                    <option value="postgresql">PostgreSQL</option>
                  </select>
                </div>

                <div>
                  <Input
                    label="Driver JDBC"
                    value={formData.jdbcDriver}
                    onChange={(e) => setFormData({ ...formData, jdbcDriver: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Hôte"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Port"
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Nom de la base"
                    value={formData.databaseName}
                    onChange={(e) => setFormData({ ...formData, databaseName: e.target.value })}
                    required
                  />
                </div>

                {formData.dbType === 'informix' && (
                  <div>
                    <Input
                      label="INFORMIXSERVER"
                      value={formData.additionalParams?.INFORMIXSERVER || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        additionalParams: { ...formData.additionalParams, INFORMIXSERVER: e.target.value }
                      })}
                      placeholder="ol_informix1210"
                    />
                  </div>
                )}

                <div>
                  <Input
                    label="Utilisateur"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <div className="relative">
                    <Input
                      label="Mot de passe"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-9 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="flex gap-2">
                    <Input
                      label="URL JDBC"
                      value={formData.jdbcUrl}
                      onChange={(e) => setFormData({ ...formData, jdbcUrl: e.target.value })}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleGenerateJdbcUrl}
                      className="mt-6"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Input
                    label="Taille du pool"
                    type="number"
                    value={formData.connectionPoolSize}
                    onChange={(e) => setFormData({ ...formData, connectionPoolSize: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Timeout (secondes)"
                    type="number"
                    value={formData.connectionTimeout}
                    onChange={(e) => setFormData({ ...formData, connectionTimeout: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Requête de test"
                    value={formData.testQuery}
                    onChange={(e) => setFormData({ ...formData, testQuery: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Configuration par défaut</span>
                  </label>
                </div>
              </div>

              {testResults['test-form'] && (
                <div className={`p-3 rounded-lg ${testResults['test-form'].success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <p className="text-sm font-medium">{testResults['test-form'].message}</p>
                  {testResults['test-form'].responseTime && (
                    <p className="text-xs mt-1">Temps de réponse: {testResults['test-form'].responseTime}ms</p>
                  )}
                  {testResults['test-form'].error && (
                    <p className="text-xs mt-1">{testResults['test-form'].error}</p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  icon={TestTube}
                  onClick={handleTestFormConnection}
                  disabled={testingForm || !formData.jdbcUrl}
                >
                  {testingForm ? 'Test en cours...' : 'Tester la connexion'}
                </Button>
                <div className="flex-1"></div>
                <Button type="submit" variant="primary" icon={Save}>
                  Enregistrer
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {configs.map((config) => {
          const testResult = testResults[config.id!];
          return (
            <Card key={config.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{config.configName}</h3>
                      {config.isDefault && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Par défaut
                        </span>
                      )}
                      {config.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded flex items-center gap-1">
                          <X className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Type:</span> {config.dbType}</p>
                      <p><span className="font-medium">Hôte:</span> {config.host}:{config.port}</p>
                      <p><span className="font-medium">Base:</span> {config.databaseName}</p>
                      <p><span className="font-medium">Utilisateur:</span> {config.username}</p>
                      <p className="font-mono text-xs bg-gray-50 p-2 rounded">{config.jdbcUrl}</p>
                    </div>
                    {testResult && (
                      <div className={`mt-3 p-3 rounded-lg ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        <p className="text-sm font-medium">{testResult.message}</p>
                        {testResult.responseTime && (
                          <p className="text-xs mt-1">Temps de réponse: {testResult.responseTime}ms</p>
                        )}
                        {testResult.error && (
                          <p className="text-xs mt-1">{testResult.error}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={TestTube}
                      onClick={() => handleTestConnection(config)}
                      disabled={testing === config.id}
                    >
                      {testing === config.id ? 'Test en cours...' : 'Tester'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit2}
                      onClick={() => handleEdit(config)}
                    >
                      Modifier
                    </Button>
                    {!config.isDefault && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetDefault(config.id!)}
                      >
                        Définir par défaut
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDelete(config.id!)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {configs.length === 0 && !showForm && (
        <Card>
          <div className="p-12 text-center">
            <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune configuration</h3>
            <p className="text-gray-600 mb-6">
              Créez votre première configuration de connexion CoreBanking
            </p>
            <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
              Créer une configuration
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CoreBankingConfigPage;

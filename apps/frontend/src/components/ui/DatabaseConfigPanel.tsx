import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle, AlertTriangle, Save, Server } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import { useToast } from './Toaster';
import { useNotification } from '../../context/NotificationContext';
import { db } from '../../services/db';

interface DatabaseConfigPanelProps {
  onConfigChange?: (changed: boolean) => void;
}

const DatabaseConfigPanel: React.FC<DatabaseConfigPanelProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState({
    host: 'localhost',
    port: '3306',
    database: 'bankdb',
    username: 'bankapp',
    password: ''
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
    testConnection();
  }, []);

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      const result = await db.testConnection();

      setConnectionStatus({
        success: result.success,
        message: result.message,
        data: result.success ? {
          mode: 'Backend API',
          timestamp: new Date().toISOString()
        } : undefined
      });

      if (result.success) {
        addToast('Connection to backend successful', 'success');
      } else {
        addToast(result.message, 'error');
      }

      onConfigChange?.(false);
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: 'Connection test failed',
        error: error instanceof Error ? error.message : String(error)
      });
      addToast('Connection test failed', 'error');
      onConfigChange?.(false);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);

    try {
      showNotification('Database configuration is managed via environment variables', 'info');
      addToast('Configuration is managed via environment variables', 'info');

      onConfigChange?.(true);
    } catch (error) {
      addToast('Failed to save configuration', 'error');
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
            Database Configuration
          </h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={isTestingConnection ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              onClick={testConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save className="h-4 w-4" />}
              onClick={handleSaveConfig}
              disabled={isSaving || isTestingConnection}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Database Type
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value="mysql"
              disabled={true}
            >
              <option value="mysql">MySQL (via Backend API)</option>
            </select>
            <p className="mt-1 text-xs text-gray-600">
              All database operations are handled by the backend API
            </p>
          </div>

          <div className="space-y-4 opacity-50">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Host"
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
              label="Database"
              value={config.database}
              onChange={(e) => setConfig({ ...config, database: e.target.value })}
              disabled={true}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Username"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                disabled={true}
              />
              <Input
                label="Password"
                type="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                disabled={true}
              />
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-md p-4">
            <div className="flex items-start">
              <Server className="h-5 w-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-primary-800 font-medium">
                  Backend API Mode
                </p>
                <ul className="mt-2 text-sm text-primary-700 space-y-1">
                  <li>All data operations are handled by the backend API</li>
                  <li>Database configuration is managed via environment variables</li>
                  <li>The backend supports MySQL/MariaDB and Informix CBS</li>
                </ul>
                <p className="mt-2 text-sm text-primary-700">
                  To modify configuration, update the <code>.env</code> file and restart the backend server.
                </p>
              </div>
            </div>
          </div>

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

import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, XCircle, Loader, Trash2, HardDrive, AlertCircle } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface DriverStatus {
  name: string;
  className: string;
  fileName: string;
  version: string;
  description: string;
  installed: boolean;
  size?: number;
  lastModified?: string;
}

interface DriversStatus {
  [key: string]: DriverStatus;
}

const JdbcDriverManager: React.FC = () => {
  const [drivers, setDrivers] = useState<DriversStatus>({});
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    loadDriversStatus();
  }, []);

  const loadDriversStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/corebanking/drivers`);
      setDrivers(response.data);
    } catch (error) {
      console.error('Failed to load drivers status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDriver = async (dbType: string) => {
    try {
      setDownloading(dbType);
      setDownloadProgress({ ...downloadProgress, [dbType]: 0 });

      const response = await fetch(`${API_URL}/api/corebanking/drivers/${dbType}/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;

          if (value) {
            const text = decoder.decode(value);
            const lines = text.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.substring(6));
                if (data.percent) {
                  setDownloadProgress({ ...downloadProgress, [dbType]: data.percent });
                }
                if (data.success) {
                  await loadDriversStatus();
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to download driver:', error);
      alert('Échec du téléchargement du driver');
    } finally {
      setDownloading(null);
      setDownloadProgress({ ...downloadProgress, [dbType]: 0 });
    }
  };

  const handleDeleteDriver = async (dbType: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce driver ?')) return;

    try {
      await axios.delete(`${API_URL}/api/corebanking/drivers/${dbType}`);
      await loadDriversStatus();
    } catch (error) {
      console.error('Failed to delete driver:', error);
      alert('Échec de la suppression du driver');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getDbTypeLabel = (dbType: string) => {
    const labels: Record<string, string> = {
      informix: 'Informix',
      oracle: 'Oracle',
      mysql: 'MySQL',
      postgresql: 'PostgreSQL'
    };
    return labels[dbType] || dbType;
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Chargement des drivers...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <HardDrive className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Drivers JDBC</h2>
            <p className="text-sm text-gray-600">Gérer les pilotes de connexion aux bases de données</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Information importante</p>
              <p>Les drivers JDBC sont nécessaires pour établir des connexions aux bases de données.
              Téléchargez le driver correspondant au type de base de données que vous souhaitez utiliser.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {Object.entries(drivers).map(([dbType, driver]) => (
            <div
              key={dbType}
              className={`border rounded-lg p-4 ${
                driver.installed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getDbTypeLabel(dbType)}
                    </h3>
                    {driver.installed ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Installé
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Non installé
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Nom:</span> {driver.name}</p>
                    <p><span className="font-medium">Classe:</span> <code className="bg-white px-2 py-0.5 rounded text-xs">{driver.className}</code></p>
                    <p><span className="font-medium">Version:</span> {driver.version}</p>
                    <p><span className="font-medium">Fichier:</span> {driver.fileName}</p>
                    {driver.installed && driver.size && (
                      <p><span className="font-medium">Taille:</span> {formatBytes(driver.size)}</p>
                    )}
                    <p className="text-gray-500 italic">{driver.description}</p>
                  </div>

                  {downloading === dbType && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Loader className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm text-gray-700">
                          Téléchargement en cours... {downloadProgress[dbType] || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${downloadProgress[dbType] || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {!driver.installed ? (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Download}
                      onClick={() => handleDownloadDriver(dbType)}
                      disabled={downloading !== null}
                    >
                      Télécharger
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDeleteDriver(dbType)}
                      disabled={downloading !== null}
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default JdbcDriverManager;

import { useState, useEffect } from 'react';
import { Activity, Database, Clock, Zap } from 'lucide-react';
import Card from '../../../components/ui/Card';
import { db } from '../../../services/db';

const PerformanceMonitor = () => {
  const [stats, setStats] = useState({
    cacheSize: 0,
    activeRequests: 0,
    queuedRequests: 0,
    lastUpdate: new Date()
  });

  useEffect(() => {
    const updateStats = () => {
      const cacheStats = db.getCacheStats();
      
      // Only update if stats have changed to prevent unnecessary re-renders
      if (cacheStats.cacheSize !== stats.cacheSize || 
          cacheStats.activeRequests !== stats.activeRequests ||
          cacheStats.queuedRequests !== stats.queuedRequests) {
        setStats({
          ...cacheStats,
          lastUpdate: new Date()
        });
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-primary-800">Performance Monitor</h3>
        </div>
        <div className="text-xs text-primary-600">
          Dernière mise à jour: {formatTime(stats.lastUpdate)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-primary-100">
          <div className="p-2 bg-primary-100 rounded-full">
            <Database className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Cache Entries</p>
            <p className="text-lg font-bold text-primary-600">{stats.cacheSize}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-secondary-100">
          <div className="p-2 bg-secondary-100 rounded-full">
            <Clock className="h-4 w-4 text-secondary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Requêtes Actives</p>
            <p className="text-lg font-bold text-secondary-600">{stats.activeRequests}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-success-100">
          <div className="p-2 bg-success-100 rounded-full">
            <Zap className="h-4 w-4 text-success-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">File d'Attente</p>
            <p className="text-lg font-bold text-success-600">{stats.queuedRequests}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Optimisé pour 120k+ enregistrements</span>
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 bg-success-500 rounded-full animate-pulse"></div>
            <span className="text-success-600 font-medium">Système Optimisé</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PerformanceMonitor;
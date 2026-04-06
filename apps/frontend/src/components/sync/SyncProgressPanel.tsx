import React, { useEffect } from 'react';
import { Activity, CheckCircle, AlertCircle, Radio, Database } from 'lucide-react';
import { useSyncProgress, SyncTableCompleteEvent } from '@/hooks/useSyncProgress';
import Card from '@/components/ui/Card';

const SyncProgressPanel: React.FC = () => {
  const {
    connected, running, currentTable, progress,
    lastBatch, lastComplete, tables,
    connect, disconnect,
  } = useSyncProgress();

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const completedTables = Object.values(tables);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="w-5 h-5" />
          Sync CBS
        </h3>
        <span className={`flex items-center gap-1 text-sm ${connected ? 'text-green-600' : 'text-gray-400'}`}>
          <Radio className="w-3 h-3" />
          {connected ? 'Connecte' : 'Deconnecte'}
        </span>
      </div>

      {/* Progress bar */}
      {running && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span className="flex items-center gap-1">
              <Activity className="w-4 h-4 animate-pulse text-blue-500" />
              {currentTable}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {lastBatch && (
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
              <span>Offset: {lastBatch.offset + lastBatch.batchSize}/{lastBatch.totalCount}</span>
              <span>Upserted: {lastBatch.upserted}</span>
              <span>Batch: {lastBatch.batchDurationMs}ms</span>
            </div>
          )}
        </div>
      )}

      {/* Last sync complete */}
      {!running && lastComplete && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4" />
          Sync termine: {lastComplete.tablesProcessed} table(s) en {(lastComplete.durationMs / 1000).toFixed(1)}s
        </div>
      )}

      {/* Completed tables */}
      {completedTables.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Tables traitees</h4>
          {completedTables.map((t: SyncTableCompleteEvent) => (
            <div key={t.table} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
              <div className="flex items-center gap-2">
                {t.errors > 0 ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <span className="font-mono">{t.table}</span>
                {t.cdc && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">CDC</span>
                )}
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>{t.upserted} sync</span>
                <span>{t.anomalies} anomalies</span>
                {t.errors > 0 && <span className="text-red-500">{t.errors} erreurs</span>}
                <span>{(t.durationMs / 1000).toFixed(1)}s</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!running && completedTables.length === 0 && connected && (
        <p className="text-sm text-gray-400 text-center py-4">
          En attente du prochain sync...
        </p>
      )}
    </Card>
  );
};

export default SyncProgressPanel;

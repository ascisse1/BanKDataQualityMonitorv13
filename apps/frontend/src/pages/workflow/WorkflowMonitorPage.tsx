import React from 'react';
import { Activity } from 'lucide-react';
import Card from '@/components/ui/Card';

export const WorkflowMonitorPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Suivi du workflow de correction et validation
        </p>
      </div>

      <Card>
        <div className="p-8 text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Le suivi du workflow de correction CBS est disponible via les pages Anomalies, Tickets et Validation.
          </p>
        </div>
      </Card>
    </div>
  );
};

import React from 'react';
import { useNotification } from '../../context/NotificationContext';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Chargement en cours...' }) => {
  const { isLoading } = useNotification();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center max-w-sm">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-800 font-medium text-center">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
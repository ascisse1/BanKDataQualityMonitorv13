import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'loading';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (message: string, type: NotificationType, duration?: number) => void;
  hideNotification: (id: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingNotificationId, setLoadingNotificationId] = useState<string | null>(null);

  const showNotification = (message: string, type: NotificationType, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // If this is a loading notification, store its ID
    if (type === 'loading') {
      // Remove any existing loading notifications
      setNotifications(prev => prev.filter(n => n.type !== 'loading'));
      setLoadingNotificationId(id);
    }
    
    setNotifications(prev => [...prev, { id, type, message, duration }]);

    if (duration > 0 && type !== 'loading') {
      setTimeout(() => {
        hideNotification(id);
      }, duration);
    }

    return id;
  };

  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    // If this was the loading notification, clear the ID
    if (id === loadingNotificationId) {
      setLoadingNotificationId(null);
    }
  };

  const showLoading = (_message = 'Chargement en cours...') => {
    setIsLoading(true);
    // Removed: showNotification(message, 'loading', 0);
  };

  const hideLoading = () => {
    setIsLoading(false);
    if (loadingNotificationId) {
      hideNotification(loadingNotificationId);
    }
  };

  const showSuccess = (message: string, duration = 3000) => {
    showNotification(message, 'success', duration);
  };

  const showError = (message: string, duration = 3000) => {
    showNotification(message, 'error', duration);
  };

  const showInfo = (message: string, duration = 3000) => {
    showNotification(message, 'info', duration);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        hideNotification,
        isLoading,
        setIsLoading,
        showLoading,
        hideLoading,
        showSuccess,
        showError,
        showInfo
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationDisplay: React.FC = () => {
  const { notifications, hideNotification } = useNotification();

  // Filter out loading notifications
  const filteredNotifications = notifications.filter(notification => notification.type !== 'loading');

  if (filteredNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2">
      {filteredNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-center p-4 rounded-lg shadow-lg max-w-md animate-fade-in ${
            notification.type === 'success' ? 'bg-success-50 border-l-4 border-success-500' :
            notification.type === 'error' ? 'bg-error-50 border-l-4 border-error-500' :
            'bg-primary-50 border-l-4 border-primary-500'
          }`}
        >
          <div className="flex-shrink-0 mr-3">
            {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-success-500" />}
            {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-error-500" />}
            {notification.type === 'info' && <Info className="h-5 w-5 text-primary-500" />}
          </div>
          <div className="flex-1 mr-2">
            <p className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-success-800' :
              notification.type === 'error' ? 'text-error-800' :
              'text-primary-800'
            }`}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => hideNotification(notification.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
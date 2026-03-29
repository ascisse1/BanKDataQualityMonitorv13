import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { monitoring } from '../services/monitoring';

interface UserInfo {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
  structureCode?: string;
}

/**
 * Hook to integrate monitoring with React components.
 * Automatically tracks page views and provides monitoring utilities.
 */
export function useMonitoring() {
  const location = useLocation();

  // Track page views on route changes
  useEffect(() => {
    monitoring.trackPageView(location.pathname, {
      search: location.search,
      hash: location.hash
    });
  }, [location.pathname, location.search, location.hash]);

  // Set user context
  const setUser = useCallback((user: UserInfo | null) => {
    monitoring.setUser(user);
  }, []);

  // Clear user on logout
  const clearUser = useCallback(() => {
    monitoring.clearUser();
  }, []);

  // Track custom events
  const trackEvent = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    monitoring.trackEvent(eventName, properties);
  }, []);

  // Track user actions
  const trackAction = useCallback((action: string, target?: string, properties?: Record<string, unknown>) => {
    monitoring.trackUserAction(action, target, properties);
  }, []);

  // Capture errors
  const captureError = useCallback((error: Error, context?: Record<string, unknown>) => {
    monitoring.captureError(error, context);
  }, []);

  // Capture exceptions (unknown types)
  const captureException = useCallback((error: unknown, context?: Record<string, unknown>) => {
    monitoring.captureException(error, context);
  }, []);

  // Log methods
  const log = {
    debug: (category: Parameters<typeof monitoring.debug>[0], message: string, details?: Record<string, unknown>) => {
      monitoring.debug(category, message, details);
    },
    info: (category: Parameters<typeof monitoring.info>[0], message: string, details?: Record<string, unknown>) => {
      monitoring.info(category, message, details);
    },
    warning: (category: Parameters<typeof monitoring.warning>[0], message: string, details?: Record<string, unknown>) => {
      monitoring.warning(category, message, details);
    },
    error: (category: Parameters<typeof monitoring.error>[0], message: string, details?: Record<string, unknown>) => {
      monitoring.error(category, message, details);
    }
  };

  return {
    setUser,
    clearUser,
    trackEvent,
    trackAction,
    captureError,
    captureException,
    log,
    sessionId: monitoring.getSessionId(),
    errorCount: monitoring.getErrorCount()
  };
}

/**
 * Hook for tracking component-level errors.
 * Use in error boundaries or try-catch blocks.
 */
export function useErrorTracking() {
  const captureError = useCallback((error: Error, componentName?: string, additionalInfo?: Record<string, unknown>) => {
    monitoring.captureError(error, {
      component: componentName,
      ...additionalInfo
    });
  }, []);

  const captureException = useCallback((error: unknown, componentName?: string, additionalInfo?: Record<string, unknown>) => {
    monitoring.captureException(error, {
      component: componentName,
      ...additionalInfo
    });
  }, []);

  return { captureError, captureException };
}

/**
 * Hook for tracking business events.
 */
export function useBusinessTracking() {
  const trackAnomalyAction = useCallback((action: string, anomalyId: number | string, details?: Record<string, unknown>) => {
    monitoring.trackEvent(`anomaly_${action}`, {
      anomalyId,
      ...details
    });
  }, []);

  const trackTicketAction = useCallback((action: string, ticketId: number | string, details?: Record<string, unknown>) => {
    monitoring.trackEvent(`ticket_${action}`, {
      ticketId,
      ...details
    });
  }, []);

  const trackValidation = useCallback((action: string, details?: Record<string, unknown>) => {
    monitoring.trackEvent(`validation_${action}`, details);
  }, []);

  const trackDataExport = useCallback((format: string, recordCount: number, details?: Record<string, unknown>) => {
    monitoring.trackEvent('data_export', {
      format,
      recordCount,
      ...details
    });
  }, []);

  const trackSearch = useCallback((query: string, resultCount: number, filters?: Record<string, unknown>) => {
    monitoring.trackEvent('search', {
      query,
      resultCount,
      filters
    });
  }, []);

  return {
    trackAnomalyAction,
    trackTicketAction,
    trackValidation,
    trackDataExport,
    trackSearch
  };
}

export default useMonitoring;

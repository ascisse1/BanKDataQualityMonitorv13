/**
 * Frontend Monitoring Service
 * Handles log shipping to backend, performance tracking, and session tracking.
 * Subscribes to the unified log service for log entries.
 */

import { log, type LogEntry } from './log';

interface UserContext {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
  structureCode?: string;
}

interface MonitoringConfig {
  enabled: boolean;
  endpoint: string;
  batchSize: number;
  flushInterval: number; // ms
  maxRetries: number;
  sampleRate: number; // 0-1, percentage of events to capture
  environment: string;
}

class MonitoringService {
  private static instance: MonitoringService;
  private config: MonitoringConfig;
  private logBuffer: LogEntry[] = [];
  private sessionId: string;
  private userContext: UserContext | null = null;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private isOnline: boolean = true;
  private offlineBuffer: LogEntry[] = [];
  private errorCount: number = 0;
  private pageLoadTime: number;

  private constructor() {
    this.config = {
      enabled: true,
      endpoint: '/api/monitoring/logs',
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      maxRetries: 3,
      sampleRate: 1.0,
      environment: import.meta.env.MODE || 'development'
    };

    this.sessionId = this.generateSessionId();
    this.pageLoadTime = performance.now();

    this.init();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private init(): void {
    // Start flush timer
    this.startFlushTimer();

    // Track online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushOfflineBuffer();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Subscribe to the unified log service
    log.addListener((entry) => {
      if (!this.shouldCapture()) return;
      this.addToBuffer(entry);

      // Errors are sent immediately
      if (entry.level === 'error') {
        this.errorCount++;
        this.flush();
      }
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(); // Flush logs when user leaves page
      }
    });

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Track performance metrics
    this.trackPerformanceMetrics();

    log.info('system', 'Monitoring service initialized', {
      sessionId: this.sessionId,
      environment: this.config.environment
    });
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${randomPart}`;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private shouldCapture(): boolean {
    return this.config.enabled && Math.random() < this.config.sampleRate;
  }

  private addToBuffer(entry: LogEntry): void {
    if (this.isOnline) {
      this.logBuffer.push(entry);

      // Auto-flush if buffer is full
      if (this.logBuffer.length >= this.config.batchSize) {
        this.flush();
      }
    } else {
      // Store offline
      this.offlineBuffer.push(entry);
      // Limit offline buffer size
      if (this.offlineBuffer.length > 500) {
        this.offlineBuffer = this.offlineBuffer.slice(-500);
      }
    }
  }

  private async flushOfflineBuffer(): Promise<void> {
    if (this.offlineBuffer.length > 0) {
      const logsToSend = [...this.offlineBuffer];
      this.offlineBuffer = [];
      await this.sendLogs(logsToSend);
    }
  }

  public async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    await this.sendLogs(logsToSend);
  }

  private async sendLogs(logs: LogEntry[], retryCount = 0): Promise<void> {
    if (!this.config.enabled || logs.length === 0) {
      return;
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          environment: this.config.environment,
          logs
        }),
        // Use keepalive for page unload scenarios
        keepalive: true
      });

      if (!response.ok && retryCount < this.config.maxRetries) {
        // Retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.sendLogs(logs, retryCount + 1);
      }
    } catch (error) {
      if (retryCount < this.config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return this.sendLogs(logs, retryCount + 1);
      }
      // Store failed logs in offline buffer
      this.offlineBuffer.push(...logs);
    }
  }

  // ========================================
  // Error Capture
  // ========================================

  public captureError(error: Error, context?: Record<string, unknown>): void {
    log.error('system', error.message, {
      name: error.name,
      stack: error.stack,
      ...context
    });
  }

  public captureException(error: unknown, context?: Record<string, unknown>): void {
    if (error instanceof Error) {
      this.captureError(error, context);
    } else {
      log.error('system', String(error), context);
    }
  }

  // ========================================
  // User Context
  // ========================================

  public setUser(user: UserContext | null): void {
    this.userContext = user;

    // Also set user on the unified log service
    if (user) {
      log.setUser({ id: user.id, username: user.username, role: user.role });
      log.info('user', 'User context set', {
        userId: user.id,
        username: user.username,
        role: user.role
      });
    } else {
      log.setUser(null);
      log.info('user', 'User context cleared');
    }
  }

  public clearUser(): void {
    this.userContext = null;
    log.setUser(null);
    log.info('user', 'User logged out');
  }

  // ========================================
  // Performance Tracking
  // ========================================

  private trackPerformanceMetrics(): void {
    // Wait for page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        if (perfData) {
          log.info('performance', 'Page load metrics', {
            dnsLookup: perfData.domainLookupEnd - perfData.domainLookupStart,
            tcpConnection: perfData.connectEnd - perfData.connectStart,
            serverResponse: perfData.responseEnd - perfData.requestStart,
            domInteractive: perfData.domInteractive - perfData.fetchStart,
            domComplete: perfData.domComplete - perfData.fetchStart,
            pageLoad: perfData.loadEventEnd - perfData.fetchStart
          });
        }

        // Track Core Web Vitals if available
        this.trackCoreWebVitals();
      }, 0);
    });
  }

  private trackCoreWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          log.info('performance', 'LCP measured', {
            value: lastEntry.startTime,
            metric: 'LCP'
          });
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            const fidEntry = entry as PerformanceEventTiming;
            log.info('performance', 'FID measured', {
              value: fidEntry.processingStart - fidEntry.startTime,
              metric: 'FID'
            });
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          });
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // Report CLS on page hide
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            log.info('performance', 'CLS measured', {
              value: clsValue,
              metric: 'CLS'
            });
          }
        });
      } catch {
        // PerformanceObserver may not support all entry types
      }
    }
  }

  // ========================================
  // Business Event Tracking
  // ========================================

  public trackEvent(eventName: string, properties?: Record<string, unknown>): void {
    log.info('business', eventName, properties);
  }

  public trackPageView(pageName: string, properties?: Record<string, unknown>): void {
    log.info('user', `Page view: ${pageName}`, {
      ...properties,
      referrer: document.referrer,
      path: window.location.pathname
    });
  }

  public trackUserAction(action: string, target?: string, properties?: Record<string, unknown>): void {
    log.info('user', `User action: ${action}`, {
      target,
      ...properties
    });
  }

  // ========================================
  // API Request Tracking
  // ========================================

  public trackApiRequest(
    method: string,
    url: string,
    status: number,
    duration: number,
    error?: string
  ): void {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warning' : 'info';

    if (level === 'error') {
      log.error('api', `${method} ${url}`, { status, duration, error });
    } else if (level === 'warning') {
      log.warning('api', `${method} ${url}`, { status, duration, error });
    } else {
      log.info('api', `${method} ${url}`, { status, duration });
    }
  }

  // ========================================
  // Configuration
  // ========================================

  public configure(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.flushInterval) {
      this.startFlushTimer();
    }
  }

  public disable(): void {
    this.config.enabled = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }

  public enable(): void {
    this.config.enabled = true;
    this.startFlushTimer();
  }

  // ========================================
  // Getters
  // ========================================

  public getSessionId(): string {
    return this.sessionId;
  }

  public getErrorCount(): number {
    return this.errorCount;
  }

  public getBufferSize(): number {
    return this.logBuffer.length;
  }
}

export const monitoring = MonitoringService.getInstance();

// Type for PerformanceEventTiming
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

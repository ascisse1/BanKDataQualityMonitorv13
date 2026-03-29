type LogLevel = 'info' | 'warning' | 'error' | 'debug';
type LogCategory = 'api' | 'auth' | 'business' | 'database' | 'network' | 'security' | 'system' | 'ui' | 'user' | 'validation' | 'performance';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  userId?: string;
  path?: string;
}

interface UserContext {
  id?: string;
  username?: string;
  role?: string;
}

type LogListener = (entry: LogEntry) => void;

const MONITORING_ENDPOINT = '/api/monitoring/logs';

class Log {
  private static instance: Log;
  private entries: LogEntry[] = [];
  private maxEntries = 1000;
  private listeners: LogListener[] = [];
  private userContext: UserContext | null = null;
  private errorCount = 0;
  private fetchIntercepted = false;
  private errorsIntercepted = false;

  private constructor() {
    this.addEntry('info', 'system', 'Logger initialized');
    this.interceptFetch();
    this.interceptGlobalErrors();
  }

  static getInstance(): Log {
    if (!Log.instance) {
      Log.instance = new Log();
    }
    return Log.instance;
  }

  // --- Public logging methods ---

  info(category: LogCategory, message: string, details?: any): void {
    this.addEntry('info', category, message, details);
  }

  warning(category: LogCategory, message: string, details?: any): void {
    this.addEntry('warning', category, message, details);
  }

  error(category: LogCategory, message: string, details?: any): void {
    this.addEntry('error', category, message, details);
  }

  debug(category: LogCategory, message: string, details?: any): void {
    if (import.meta.env.DEV) {
      this.addEntry('debug', category, message, details);
    }
  }

  // --- User context ---

  setUser(user: UserContext | null): void {
    this.userContext = user;
  }

  // --- Entries access ---

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  clearEntries(): void {
    this.entries = [];
    this.errorCount = 0;
    this.addEntry('info', 'system', 'Logs cleared');
  }

  exportEntries(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  getErrorCount(): number {
    return this.errorCount;
  }

  resetErrorCount(): void {
    this.errorCount = 0;
  }

  // --- Listener pattern ---

  addListener(listener: LogListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // --- Internal ---

  private addEntry(level: LogLevel, category: LogCategory, message: string, details?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details,
      userId: this.userContext ? `${this.userContext.username} (${this.userContext.role})` : undefined,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    };

    this.entries.unshift(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries);
    }

    if (level === 'error') {
      this.errorCount++;
    }

    // Console output in development
    if (import.meta.env.DEV) {
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${category}]`;
      switch (level) {
        case 'error':
          console.error(prefix, message, details ?? '');
          break;
        case 'warning':
          console.warn(prefix, message, details ?? '');
          break;
        case 'debug':
          console.debug(prefix, message, details ?? '');
          break;
        default:
          console.log(prefix, message, details ?? '');
      }
    }

    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(entry);
      } catch {
        // Prevent listener errors from breaking logging
      }
    }
  }

  private interceptFetch(): void {
    if (this.fetchIntercepted) return;
    this.fetchIntercepted = true;

    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      // Skip logging for monitoring endpoint to avoid recursion
      if (url.includes(MONITORING_ENDPOINT)) {
        return originalFetch(input, init);
      }

      const method = init?.method || 'GET';
      const startTime = performance.now();

      try {
        const response = await originalFetch(input, init);
        const duration = (performance.now() - startTime).toFixed(2);
        this.addEntry('info', 'network', `${method} ${url}`, { status: response.status, duration: `${duration}ms` });
        return response;
      } catch (error) {
        const duration = (performance.now() - startTime).toFixed(2);
        this.addEntry('error', 'network', `${method} ${url} failed`, {
          error: error instanceof Error ? error.message : String(error),
          duration: `${duration}ms`,
        });
        throw error;
      }
    };
  }

  private interceptGlobalErrors(): void {
    if (this.errorsIntercepted) return;
    this.errorsIntercepted = true;

    window.addEventListener('error', (event) => {
      this.addEntry('error', 'system', `Unhandled error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.addEntry('error', 'system', 'Unhandled promise rejection', {
        reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
      });
    });
  }
}

export const log = Log.getInstance();

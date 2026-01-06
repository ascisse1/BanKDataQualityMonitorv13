type LogLevel = 'info' | 'warning' | 'error' | 'debug';
type LogCategory = 'user' | 'system' | 'api' | 'security' | 'prefetch' | 'database' | 'validation';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  userId?: string;
  path?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  private constructor() {
    // Initialize logger
    this.info('system', 'Logger initialized');
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatTimestamp(): string {
    const now = new Date();
    return now.toISOString();
    return now.toISOString();
  }

  private getCurrentUser(): string | undefined {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return `${userData.username} (${userData.role})`;
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  }

  private addLog(level: LogLevel, category: LogCategory, message: string, details?: any): void {
    const logEntry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      category,
      message,
      details,
      userId: this.getCurrentUser(),
      path: window.location.pathname
    };

    this.logs.unshift(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also log to console in development
    if (import.meta.env.DEV) {
      const consoleMsg = `[${logEntry.timestamp}] [${level.toUpperCase()}] [${category}] ${message}`;
      switch (level) {
        case 'error':
          console.error(consoleMsg, details);
          break;
        case 'warning':
          console.warn(consoleMsg, details);
          break;
        case 'debug':
          console.debug(consoleMsg, details);
          break;
        default:
          console.log(consoleMsg, details);
      }
    }
  }

  public info(category: LogCategory, message: string, details?: any) {
    this.addLog('info', category, message, details);
  }

  public warning(category: LogCategory, message: string, details?: any) {
    this.addLog('warning', category, message, details);
  }

  public error(category: LogCategory, message: string, details?: any) {
    this.addLog('error', category, message, details);
  }

  public debug(category: LogCategory, message: string, details?: any) {
    if (import.meta.env.DEV) {
      this.addLog('debug', category, message, details);
    }
  }

  public getLogs(): LogEntry[] {
    return this.logs;
  }

  public clearLogs() {
    this.logs = [];
    this.info('system', 'Logs cleared');
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
// Use native Date formatting instead of date-fns
}
export const logger = Logger.getInstance();
type TracerLevel = 'debug' | 'info' | 'warning' | 'error';
type TracerCategory = 'network' | 'database' | 'ui' | 'auth' | 'system' | 'business';

interface TracerOptions {
  enabled: boolean;
  consoleOutput: boolean;
  fileOutput: boolean;
  logLevel: TracerLevel;
  maxEntries: number;
  interceptConsole: boolean;
}

interface TracerEntry {
  timestamp: string;
  level: TracerLevel;
  category: TracerCategory;
  message: string;
  details?: any;
  stack?: string;
}

class Tracer {
  private static instance: Tracer;
  private entries: TracerEntry[] = [];
  private options: TracerOptions = {
    enabled: true,
    consoleOutput: true,
    fileOutput: false,
    logLevel: 'debug',
    maxEntries: 1000,
    interceptConsole: false // Set to false by default to avoid recursion
  };
  private listeners: Array<(entry: TracerEntry) => void> = [];
  private originalConsole: Record<string, Function> = {};
  private isOutputting: boolean = false;
  private fetchIntercepted: boolean = false;
  private errorIntercepted: boolean = false;
  private errorCount: number = 0;

  private constructor() {
    this.originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
      debug: console.debug
    };
    
    this.addEntry('debug', 'system', 'Tracer initialized');
    
    try {
      // Intercept fetch requests
      this.interceptFetch();
      
      // Intercept global errors
      this.interceptGlobalErrors();
    } catch (error) {
      console.error('Error initializing tracer:', error);
    }
  }

  public static getInstance(): Tracer {
    if (!Tracer.instance) {
      Tracer.instance = new Tracer();
    }
    return Tracer.instance;
  }

  private formatTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  private shouldLog(level: TracerLevel): boolean {
    const levels: Record<TracerLevel, number> = {
      debug: 0,
      info: 1,
      warning: 2,
      error: 3
    };
    
    return this.options.enabled && levels[level] >= levels[this.options.logLevel];
  }

  private addEntry(level: TracerLevel, category: TracerCategory, message: string, details?: any): TracerEntry | null {
    if (!this.shouldLog(level)) {
      return null;
    }
    
    // Get stack trace for errors
    let stack: string | undefined;
    if (level === 'error') {
      try {
        throw new Error();
      } catch (e) {
        stack = (e as Error).stack?.split('\n').slice(3).join('\n');
      }
    }
    
    const entry: TracerEntry = {
      timestamp: this.formatTimestamp(),
      level,
      category,
      message,
      details,
      stack
    };
    
    // Add to entries
    this.entries.unshift(entry);
    
    // Increment error count
    if (level === 'error') {
      this.errorCount++;
    }
    
    // Limit entries
    if (this.entries.length > this.options.maxEntries) {
      this.entries = this.entries.slice(0, this.options.maxEntries);
    }
    
    // Output to console if enabled and not already outputting
    if (this.options.consoleOutput && !this.isOutputting) {
      this.isOutputting = true;
      try {
        this.outputToConsole(entry);
      } finally {
        this.isOutputting = false;
      }
    }
    
    // Notify listeners
    this.notifyListeners(entry);
    
    return entry;
  }
  
  private outputToConsole(entry: TracerEntry): void {
    try {
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
      
      switch (entry.level) {
        case 'debug':
          this.originalConsole.debug(prefix, entry.message, entry.details || '');
          break;
        case 'info':
          this.originalConsole.info(prefix, entry.message, entry.details || '');
          break;
        case 'warning':
          this.originalConsole.warn(prefix, entry.message, entry.details || '');
          break;
        case 'error':
          this.originalConsole.error(prefix, entry.message, entry.details || '', entry.stack ? `\n${entry.stack}` : '');
          break;
      }
    } catch (error) {
      // Prevent infinite recursion
      this.originalConsole.error('Error in tracer outputToConsole:', error);
    }
  }
  
  private notifyListeners(entry: TracerEntry): void {
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (error) {
        this.originalConsole.error('Error in tracer listener:', error);
      }
    });
  }
  
  public enableConsoleInterception(): void {
    if (this.options.interceptConsole) {
      return; // Already intercepted
    }
    
    this.options.interceptConsole = true;
    
    // Store original methods to avoid recursion
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalDebug = console.debug;
    
    // Create a flag to prevent recursion
    let isIntercepting = false;
    
    console.log = (...args) => {
      if (!isIntercepting) {
        isIntercepting = true;
        try {
          this.debug('system', typeof args[0] === 'string' ? args[0] : 'Console log', args.length > 1 ? args.slice(1) : undefined);
        } finally {
          isIntercepting = false;
        }
      }
      originalLog.apply(console, args);
    };
    
    console.info = (...args) => {
      if (!isIntercepting) {
        isIntercepting = true;
        try {
          this.info('system', typeof args[0] === 'string' ? args[0] : 'Console info', args.length > 1 ? args.slice(1) : undefined);
        } finally {
          isIntercepting = false;
        }
      }
      originalInfo.apply(console, args);
    };
    
    console.warn = (...args) => {
      if (!isIntercepting) {
        isIntercepting = true;
        try {
          this.warning('system', typeof args[0] === 'string' ? args[0] : 'Console warning', args.length > 1 ? args.slice(1) : undefined);
        } finally {
          isIntercepting = false;
        }
      }
      originalWarn.apply(console, args);
    };
    
    console.error = (...args) => {
      if (!isIntercepting) {
        isIntercepting = true;
        try {
          this.error('system', typeof args[0] === 'string' ? args[0] : 'Console error', args.length > 1 ? args.slice(1) : undefined);
        } finally {
          isIntercepting = false;
        }
      }
      originalError.apply(console, args);
    };
    
    console.debug = (...args) => {
      if (!isIntercepting) {
        isIntercepting = true;
        try {
          this.debug('system', typeof args[0] === 'string' ? args[0] : 'Console debug', args.length > 1 ? args.slice(1) : undefined);
        } finally {
          isIntercepting = false;
        }
      }
      originalDebug.apply(console, args);
    };
    
    this.debug('system', 'Console methods intercepted');
  }
  
  public disableConsoleInterception(): void {
    if (!this.options.interceptConsole) {
      return; // Not intercepted
    }
    
    this.options.interceptConsole = false;

    console.log = this.originalConsole.log as typeof console.log;
    console.info = this.originalConsole.info as typeof console.info;
    console.warn = this.originalConsole.warn as typeof console.warn;
    console.error = this.originalConsole.error as typeof console.error;
    console.debug = this.originalConsole.debug as typeof console.debug;
    
    this.debug('system', 'Console methods restored');
  }
  
  private interceptFetch(): void {
    if (this.fetchIntercepted) {
      return;
    }
    
    try {
      this.fetchIntercepted = true;
      const originalFetch = window.fetch;
      
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const method = init?.method || 'GET';
        
        const requestId = Math.random().toString(36).substring(2, 9);
        
        this.info('network', `${method} request started: ${url}`, { requestId });
        
        const startTime = performance.now();
        
        try {
          const response = await originalFetch(input, init);
          
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          this.info('network', `${method} request completed: ${url}`, { 
            requestId, 
            status: response.status, 
            duration: `${duration.toFixed(2)}ms` 
          });
          
          return response;
        } catch (error) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          this.error('network', `${method} request failed: ${url}`, { 
            requestId, 
            error: error instanceof Error ? error.message : String(error), 
            duration: `${duration.toFixed(2)}ms` 
          });
          
          throw error;
        }
      };
    } catch (error) {
      console.error('Error intercepting fetch:', error);
    }
  }
  
  private interceptGlobalErrors(): void {
    if (this.errorIntercepted) {
      return;
    }
    
    try {
      this.errorIntercepted = true;
      
      window.addEventListener('error', (event) => {
        try {
          this.error('system', `Unhandled error: ${event.message}`, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
          });
        } catch (e) {
          console.error('Error in error handler:', e);
        }
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        try {
          this.error('system', `Unhandled promise rejection`, {
            reason: event.reason
          });
        } catch (e) {
          console.error('Error in unhandledrejection handler:', e);
        }
      });
    } catch (error) {
      console.error('Error setting up error handlers:', error);
    }
  }

  public debug(category: TracerCategory, message: string, details?: any): TracerEntry | null {
    return this.addEntry('debug', category, message, details);
  }

  public info(category: TracerCategory, message: string, details?: any): TracerEntry | null {
    return this.addEntry('info', category, message, details);
  }

  public warning(category: TracerCategory, message: string, details?: any): TracerEntry | null {
    return this.addEntry('warning', category, message, details);
  }

  public error(category: TracerCategory, message: string, details?: any): TracerEntry | null {
    return this.addEntry('error', category, message, details);
  }

  public getEntries(): TracerEntry[] {
    return [...this.entries];
  }

  public clearEntries(): void {
    this.entries = [];
    this.errorCount = 0;
    this.debug('system', 'Tracer entries cleared');
  }

  public exportEntries(): string {
    return JSON.stringify(this.entries, null, 2);
  }
  
  public setOptions(options: Partial<TracerOptions>): void {
    this.options = { ...this.options, ...options };
    this.debug('system', 'Tracer options updated', this.options);
  }
  
  public getOptions(): TracerOptions {
    return { ...this.options };
  }
  
  public addListener(listener: (entry: TracerEntry) => void): () => void {
    this.listeners.push(listener);
    
    // Return function to remove listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  public getErrorCount(): number {
    return this.errorCount;
  }
  
  public resetErrorCount(): void {
    this.errorCount = 0;
  }
}

export const tracer = Tracer.getInstance();
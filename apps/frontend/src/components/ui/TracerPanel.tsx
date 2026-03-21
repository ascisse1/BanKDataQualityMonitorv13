import React, { useState, useEffect, useRef } from 'react';
import { tracer } from '../../services/tracer';
import { X, Download, RefreshCw, Bug, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import Button from './Button';

interface TracerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const TracerPanel: React.FC<TracerPanelProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [isConsoleIntercepted, setIsConsoleIntercepted] = useState<boolean>(false);
  const entriesEndRef = useRef<HTMLDivElement>(null);
  const entriesContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Initial load
      setEntries(tracer.getEntries());
      
      // Set up listener for new entries
      const removeListener = tracer.addListener((entry) => {
        setEntries(prev => [entry, ...prev].slice(0, 1000));
      });
      
      return () => removeListener();
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (autoScroll && entriesEndRef.current && entries.length > 0 && isOpen) {
      entriesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, autoScroll, isOpen]);
  
  const handleClear = () => {
    tracer.clearEntries();
    setEntries([]);
  };
  
  const handleExport = () => {
    const json = tracer.exportEntries();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `application-trace-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const toggleConsoleInterception = () => {
    if (isConsoleIntercepted) {
      tracer.disableConsoleInterception();
      setIsConsoleIntercepted(false);
    } else {
      tracer.enableConsoleInterception();
      setIsConsoleIntercepted(true);
    }
  };
  
  const filteredEntries = entries.filter(entry => {
    // Text filter
    const textMatch = filter === '' || 
      entry.message.toLowerCase().includes(filter.toLowerCase()) ||
      (entry.details && JSON.stringify(entry.details).toLowerCase().includes(filter.toLowerCase()));
    
    // Category filter
    const categoryMatch = categoryFilter === 'all' || entry.category === categoryFilter;
    
    // Level filter
    const levelMatch = levelFilter === 'all' || entry.level === levelFilter;
    
    return textMatch && categoryMatch && levelMatch;
  });
  
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-error-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-primary-500" />;
      case 'debug':
        return <Bug className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-error-600';
      case 'warning':
        return 'text-warning-600';
      case 'info':
        return 'text-primary-600';
      case 'debug':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'network':
        return 'bg-blue-100 text-blue-800';
      case 'database':
        return 'bg-green-100 text-green-800';
      case 'ui':
        return 'bg-purple-100 text-purple-800';
      case 'auth':
        return 'bg-yellow-100 text-yellow-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      case 'business':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Bug className="h-5 w-5 mr-2 text-primary-600" />
            Application Tracer
            <span className="ml-2 text-xs text-gray-500">
              ({entries.length} entries)
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Filter logs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="network">Network</option>
              <option value="database">Database</option>
              <option value="ui">UI</option>
              <option value="auth">Auth</option>
              <option value="system">System</option>
              <option value="business">Business</option>
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => setEntries(tracer.getEntries())}
            >
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExport}
            >
              Export
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              leftIcon={<X className="h-4 w-4" />}
              onClick={handleClear}
            >
              Clear
            </Button>
            
            <Button
              variant={isConsoleIntercepted ? "primary" : "outline"}
              size="sm"
              leftIcon={<Clock className="h-4 w-4" />}
              onClick={toggleConsoleInterception}
            >
              {isConsoleIntercepted ? "Disable Console Capture" : "Enable Console Capture"}
            </Button>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoScroll"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="autoScroll" className="ml-2 text-sm text-gray-700">
                Auto-scroll
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 bg-gray-100" ref={entriesContainerRef}>
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <CheckCircle className="h-12 w-12 mb-2" />
              <p className="text-lg">No log entries match your filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-md shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5">
                      {getLevelIcon(entry.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(entry.category)}`}>
                            {entry.category}
                          </span>
                          <span className={`ml-2 text-xs font-medium ${getLevelColor(entry.level)}`}>
                            {entry.level.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-900 break-words">{entry.message}</p>
                      {entry.details && (
                        <pre className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                          {typeof entry.details === 'object' 
                            ? JSON.stringify(entry.details, null, 2) 
                            : String(entry.details)}
                        </pre>
                      )}
                      {entry.stack && (
                        <details className="mt-1">
                          <summary className="text-xs text-gray-500 cursor-pointer">Stack trace</summary>
                          <pre className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                            {entry.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={entriesEndRef} />
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between">
          <div>
            {filteredEntries.length} entries shown • {entries.length} total entries
          </div>
          <div>
            <span className="mr-3">
              <span className="inline-block w-3 h-3 rounded-full bg-error-500 mr-1"></span>
              {entries.filter(e => e.level === 'error').length} errors
            </span>
            <span className="mr-3">
              <span className="inline-block w-3 h-3 rounded-full bg-warning-500 mr-1"></span>
              {entries.filter(e => e.level === 'warning').length} warnings
            </span>
            <span>
              <span className="inline-block w-3 h-3 rounded-full bg-primary-500 mr-1"></span>
              {entries.filter(e => e.level === 'info').length} info
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TracerPanel;
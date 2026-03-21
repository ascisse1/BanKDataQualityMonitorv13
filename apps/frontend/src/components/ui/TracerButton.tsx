import React, { useState, useEffect } from 'react';
import { Bug } from 'lucide-react';
import TracerPanel from './TracerPanel';
import { tracer } from '../../services/tracer';

interface TracerButtonProps {
  className?: string;
}

const TracerButton: React.FC<TracerButtonProps> = ({ className = '' }) => {
  const [showTracer, setShowTracer] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [hasNewErrors, setHasNewErrors] = useState(false);

  useEffect(() => {
    // Initial error count
    setErrorCount(tracer.getErrorCount());
    
    // Listen for new error entries
    const removeListener = tracer.addListener((entry) => {
      if (entry.level === 'error') {
        setErrorCount(tracer.getErrorCount());
        setHasNewErrors(true);
      }
    });
    
    return () => removeListener();
  }, []);

  const handleOpen = () => {
    setShowTracer(true);
    setHasNewErrors(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={`fixed bottom-4 right-4 z-40 p-3 ${hasNewErrors ? 'bg-error-600 animate-pulse' : 'bg-primary-600'} text-white rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${className}`}
        title="Open Application Tracer"
      >
        <Bug className="h-5 w-5" />
        {errorCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-error-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {errorCount > 99 ? '99+' : errorCount}
          </span>
        )}
      </button>
      
      <TracerPanel isOpen={showTracer} onClose={() => setShowTracer(false)} />
    </>
  );
};

export default TracerButton;
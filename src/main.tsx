import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { db } from './services/db';

// Configure worker threads for heavy computations
const workerCount = Math.max(2, navigator.hardwareConcurrency - 1);
const workers = new Array(workerCount).fill(null).map(() => new Worker(
  new URL('./workers/compute.worker.ts', import.meta.url),
  { type: 'module' }
));

// Initialize tracer
try {
  const { tracer } = await import('./services/tracer');
  tracer.info('system', 'Application starting', { 
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    demoMode: true
  });
} catch (error) {
  console.error('Error initializing tracer:', error);
}

// Set up global error handling
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.message, event);
  // Prevent error propagation for chart errors
  if (event.message.includes('Cannot read properties of null')) {
    event.preventDefault();
  }
  // Prevent error propagation for chart errors
  if (event.message.includes('Cannot read properties of null')) {
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent error propagation for chart errors
  if (event.reason && event.reason.message && 
      event.reason.message.includes('Cannot read properties of null')) {
    event.preventDefault();
  }
  // Prevent error propagation for chart errors
  if (event.reason && event.reason.message && 
      event.reason.message.includes('Cannot read properties of null')) {
    event.preventDefault();
  }
});

// Prefetch data in parallel with app initialization
window.requestIdleCallback?.(() => {
  console.log('Starting data prefetch');

  // Skip prefetch in production to improve initial load time
  if (import.meta.env.PROD) {
    console.log('Skipping prefetch in production for better initial load time');
    return;
  }
  
  // Prefetch critical data with a delay to avoid initial load contention
  setTimeout(() => {
    db.prefetchCommonData().then(() => {
      console.log('Data prefetch completed');
    }).catch(error => {
      console.error('Data prefetch failed', error);
    });
  }, 5000); // Increased delay to prioritize UI rendering
  
  // Preload critical routes
  const routes = ['/dashboard', '/anomalies', '/rules', '/reports'];
  routes.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
    console.debug(`Prefetched route: ${route}`);
  });
});

// Create root with concurrent features enabled
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Cleanup workers on unmount
window.addEventListener('unload', () => {
  workers.forEach(worker => worker.terminate());
  console.log('Application shutting down');
});
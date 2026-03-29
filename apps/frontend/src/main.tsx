import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { db } from './services/db';
import { log } from './services/log';

// Configure worker threads for heavy computations
const workerCount = Math.max(2, navigator.hardwareConcurrency - 1);
const workers = new Array(workerCount).fill(null).map(() => new Worker(
  new URL('./workers/compute.worker.ts', import.meta.url),
  { type: 'module' }
));

log.info('system', 'Application starting', {
  timestamp: new Date().toISOString(),
  environment: import.meta.env.MODE,
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  demoMode: true
});

// Prefetch data in parallel with app initialization
window.requestIdleCallback?.(() => {
  log.debug('system', 'Starting data prefetch');

  // Skip prefetch in production to improve initial load time
  if (import.meta.env.PROD) {
    log.debug('system', 'Skipping prefetch in production for better initial load time');
    return;
  }

  // Prefetch critical data with a delay to avoid initial load contention
  setTimeout(() => {
    db.prefetchCommonData().then(() => {
      log.info('system', 'Data prefetch completed');
    }).catch(error => {
      log.error('system', 'Data prefetch failed', { error });
    });
  }, 5000); // Increased delay to prioritize UI rendering

  // Preload critical routes
  const routes = ['/dashboard', '/anomalies', '/rules', '/reports'];
  routes.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
    log.debug('system', `Prefetched route: ${route}`);
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
  log.info('system', 'Application shutting down');
});

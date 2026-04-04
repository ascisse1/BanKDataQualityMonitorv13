import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SessionAuthProvider } from './context/SessionAuthProvider';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CommandPaletteProvider } from './components/ui/CommandPalette';
import AppRoutes from './routes/AppRoutes';
import { ToastProvider, Toaster } from './components/ui/Toaster';

import { NotificationProvider } from './context/NotificationContext';
import LoadingOverlay from './components/ui/LoadingOverlay';
import TracerButton from './components/ui/TracerButton';
import { ErrorBoundary } from './features/rules/components/ErrorBoundary/ErrorBoundary';

// Create a client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Main Application Component
 *
 * Authentication: Uses BFF (Backend For Frontend) pattern with session-based auth.
 * - SessionAuthProvider handles OAuth2 login flow via Spring Boot backend
 * - Tokens stored server-side in HttpOnly session (XSS-safe)
 * - CSRF protection enabled via Spring Security
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotificationProvider>
          <ToastProvider>
            <Router>
              <SessionAuthProvider>
                <AuthProvider>
                  <CommandPaletteProvider>
                    <ErrorBoundary>
                      <AppRoutes />
                    </ErrorBoundary>
                    <Toaster />
                    <LoadingOverlay />
                    {import.meta.env.DEV && <TracerButton />}
                  </CommandPaletteProvider>
                </AuthProvider>
              </SessionAuthProvider>
            </Router>
          </ToastProvider>
        </NotificationProvider>
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;


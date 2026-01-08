import { BrowserRouter as Router } from 'react-router-dom';
import { SessionAuthProvider } from './context/SessionAuthProvider';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CommandPaletteProvider } from './components/ui/CommandPalette';
import AppRoutes from './routes/AppRoutes';
import { ToastProvider, Toaster } from './components/ui/Toaster';

import { NotificationProvider, NotificationDisplay } from './context/NotificationContext';
import LoadingOverlay from './components/ui/LoadingOverlay';
import TracerButton from './components/ui/TracerButton';

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
    <ThemeProvider>
      <NotificationProvider>
        <ToastProvider>
          <Router>
            <SessionAuthProvider>
              <AuthProvider>
                <CommandPaletteProvider>
                  <AppRoutes />
                  <Toaster />
                  <NotificationDisplay />
                  <LoadingOverlay />
                  <TracerButton />
                </CommandPaletteProvider>
              </AuthProvider>
            </SessionAuthProvider>
          </Router>
        </ToastProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;


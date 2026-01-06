import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { ToastProvider, Toaster } from './components/ui/Toaster'; 
import { NotificationProvider, NotificationDisplay } from './context/NotificationContext';
import LoadingOverlay from './components/ui/LoadingOverlay';
import TracerButton from './components/ui/TracerButton';

function App() {
  return (
    <NotificationProvider>
      <ToastProvider>
        <Router>
          <AuthProvider>
            <AppRoutes />
            <Toaster />
            <NotificationDisplay />
            <LoadingOverlay />
            <TracerButton />
          </AuthProvider>
        </Router>
      </ToastProvider>
    </NotificationProvider>
  );
}

export default App;